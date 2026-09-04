# C2. 内部責務と推論アーキテクチャ

## 目的

推論アーキテクチャの違いを、field lineage harness の責務分離へ接続する。

## アーキテクチャ別の特徴

| 種類 | シンプルな説明 | 強いこと | 弱いこと | harnessでの使い方 |
|---|---|---|---|---|
| dense Transformer | 毎tokenで全重みを使う通常型 | 挙動が読みやすい、fine-tuningしやすい | サイズに比例して重くなる | 0.6B/3Bの分類・抽出 |
| MoE | 複数の専門家の一部だけ使う | 総パラメータの割に実行効率が良い | servingと検証が複雑 | 20B級以上のreasoning候補 |
| reasoning model | 中間推論を多めに使う | 複雑な比較、手順分解 | 遅い、出力が長い | 曖昧caseの補助判断 |
| code model | コード寄りに学習 | 関数、型、エラー説明 | 業務ドメインの意味は別 | AST結果の説明補助 |
| embedding model | 文章をベクトル化する | 類似検索、候補探索 | 生成しない | fieldやdocの検索 |
| reranker | 候補の順序を付け直す | ノイズ削減 | 新しい候補は作らない | LLMへ渡す前の圧縮 |

## 責務分離

| 責務 | 担当 | なぜそうするか |
|---|---|---|
| source抽出 | AST/parser/LSP | file、line、symbolは機械で取れるため |
| schema抽出 | Prisma/OpenAPI/SQL parser | DB column、required、defaultはschemaが正 |
| 候補生成 | 小型LLM | field名変更や意味分類は言語的判断が必要 |
| 候補検証 | harness runner | LLMの推測を確定扱いしないため |
| ranking | embedding/reranker | 長い文脈をLLMへ渡しすぎないため |
| 保存 | JSONL/SQLite/graph DB | 再現性と差分追跡のため |
| masking | preprocessor/logger | private情報を外へ出さないため |

## 情報の推論状態

| state | 意味 | 例 | 扱い |
|---|---|---|---|
| `EXTRACTED` | toolで直接取れた | `prisma.user.name` がschemaにある | 確定情報として保存 |
| `INFERRED` | 根拠から推測した | `name` が `displayName` にrenameされた | 検証待ち |
| `AMBIGUOUS` | 複数候補がある | `id` が userId か tenantId か不明 | 人間確認へ回す |
| `UNVERIFIED` | まだ確認していない | LLMが出した説明だけ | 下流へ確定渡ししない |

## LLMに渡してよい仕事

| 仕事 | 可否 | 理由 |
|---|---|---|
| fieldCategory分類 | 可 | `domain/system/meta/security` の意味判断に使える |
| transformKind候補 | 可 | rename、copy、deriveの候補を出せる |
| evidence説明 | 可 | 人間が読む説明を作れる |
| DB保存先の確定 | 不可 | schema parserで確認すべき |
| required/defaultの確定 | 不可 | validator/schemaが正 |
| security問題の断定 | 不可 | Semgrep等とpolicy検証が必要 |

## 推論の扱い方

field lineageでは、LLM出力を次のように扱う。

1. ASTとschemaから候補fieldを取る。
2. LLMへ候補だけ渡し、分類とedge候補を出させる。
3. runnerが `file/line/type/schema` で検証する。
4. 検証済みedgeだけ `confirmed` にする。
5. 不明なedgeは `AMBIGUOUS` のまま保存する。

この形にすると、LLMの強みである意味解釈を使いつつ、誤推論を保存層で分離できる。
