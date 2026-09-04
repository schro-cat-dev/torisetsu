# A. ゴール・スコープ

## ゴール

小型LLMをfield lineage harnessへ組み込む前に、モデルサイズ、推論アーキテクチャ、リソース、ライセンス、情報の扱い方を判断できる状態にする。

## 背景

ユーザーは、`req.body.name -> input.displayName -> prisma.user.data.name` のようなfield単位の運搬を取りたい。これは関数呼び出しグラフだけでは足りないため、LLM、AST、LSP、schema parser、検証runnerを役割分担させる必要がある。

## スコープ内

| ID | 対象 | 内容 |
|---|---|---|
| A1 | モデルサイズ | `B`、量子化、KV cache、実行メモリの見方 |
| A2 | 推論アーキテクチャ | dense、MoE、reasoning、code model、embeddingの違い |
| A3 | リソース | CPU、RAM、GPU/VRAM、disk、速度の見方 |
| A4 | ライセンス | Apache-2.0、MIT、独自ライセンスの扱い |
| A5 | harness接続 | LLMに任せる範囲と、機械検証で確定する範囲 |
| A6 | fine-tuning | LoRA/QLoRAで狭い分類・抽出タスクへ寄せる方針 |

## スコープ外

| 対象外 | 理由 |
|---|---|
| 特定モデルの本番採用決定 | 実ベンチ、法務確認、運用条件が未実施 |
| モデルのゼロからの事前学習 | 個人・小規模チームの現実コストに合いにくい |
| 外部AIサービス利用の安全認定 | データ送信先、契約、監査ログの確認が別途必要 |
| field lineage extractorの実装 | この文書は開発前の設計判断材料 |

## 方針

LLMは「候補生成器」として使う。確定情報はAST、LSP、package manifest、DB schema、OpenAPI、テスト、policyで検証する。

理由:

- 小型LLMは短い分類やJSON整形には使えるが、長い構造化設計を一発で正確に出す用途には弱い。
- field単位の運搬は、型、rename、mapping、default、validation、保存先が絡むため、根拠なしの自然文推論では誤差が出る。
- `INFERRED`、`AMBIGUOUS`、`UNVERIFIED` を保存できるようにすると、AIの推測と確認済み事実を混ぜずに扱える。

## 初期比較候補

| 優先 | model | 使い所 | ライセンス確認 |
|---:|---|---|---|
| 5 | `Qwen/Qwen3-4B-Instruct-2507` | 0.6Bより品質を上げる第一候補。日本語の長め出力、指示追従、構造化の比較 | Apache-2.0 |
| 4 | `deepseek-ai/DeepSeek-R1-Distill-Qwen-7B` | reasoning、評価理由、分解、自己チェックの比較 | MIT表示。ただし7B級で重い |
| 3 | `HuggingFaceTB/SmolLM3-3B` / GGUF | 軽量ローカル比較、量子化実行 | Apache-2.0 |
| 3 | `microsoft/Phi-4-mini-instruct` | 3.8B級の比較候補。多言語とreasoningを見る | MIT。ただし `trust_remote_code=True` と英語中心の注意を確認 |
| 2 | `Qwen/Qwen3-1.7B` | 0.6Bより少し大きい軽量候補 | Apache-2.0 |
| 1 | `Qwen/Qwen3-0.6B` | 疎通、分類、JSON出力の下限確認だけ | Apache-2.0。長文構造化生成では比較優先度低 |

## 判断しないこと

この文書では「このモデルが最終採用」や「性能として十分」とは決めない。次のステップで、同じ評価caseを各モデルへ流し、速度、RAM、JSON成功率、field分類精度、誤推論率、外部consumerから見た受け取りやすさを測って決める。

## 性能十分性の見方

性能は、長いpromptで賢そうな文章が出るかでは判断しない。field lineage harness用途では、入力を細かく分け、contextを最小化し、出力も最小JSONにしたうえで、下流のrunnerが受け取れるかを見る。

| 見るもの | OKの例 | NGの例 |
|---|---|---|
| 入力粒度 | 1つのfield移動、1つのvalidator、1つのschema対応だけ渡す | route全体、usecase全体、設計書全体を丸ごと渡す |
| context量 | file、line、expression、近傍3-10行、schema抜粋 | 関係ない関数やREADMEまで混ぜる |
| 出力量 | `edges: []`、`unknowns: []`、`confidence` だけ | 長い説明文、推測の列挙 |
| 外部検証 | runnerがschema parse、静的検証、期待値比較できる | 人間が読んで良さそうと判断するだけ |
