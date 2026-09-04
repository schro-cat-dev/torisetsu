# B. 品質チェックリスト

## 目的

小型LLMと推論アーキテクチャの調査結果を、field lineage harness 開発に使える品質で残す。

## チェックリスト

| ID | 観点 | 確認項目 | OK条件 | 状態 |
|---|---|---|---|---|
| B1 | 単位 | `B`、量子化、KV cacheの意味が分かれる | モデルサイズと実行メモリを混同していない | OK |
| B2 | リソース | CPU/RAM/GPU/disk/速度の見方がある | 3B、7B、20B級の目安がある | OK |
| B3 | アーキテクチャ | dense、MoE、reasoning、code、embeddingが分かれる | 何が速さ・精度・推論に効くかが書かれている | OK |
| B4 | 情報の扱い | LLM推論と機械検証が分かれる | `confirmed/inferred/ambiguous` を分離する | OK |
| B5 | harness接続 | field lineage用の入出力がある | source、sink、transform、classification、evidenceを持つ | OK |
| B6 | ライセンス | Apache/MIT/独自を分ける | model IDごとに確認が必要と書く | OK |
| B7 | 漏洩対策 | 外部送信とローカル推論を分ける | private情報を外部APIへ送らない方針がある | OK |
| B8 | 完了条件 | 次の開発に入る条件がある | 評価case、runner、合格基準が書かれている | OK |
| B9 | context最小化 | 1回のLLM入力を小さくできる | field単位、近傍行、schema抜粋に分かれている | OK |
| B10 | output最小化 | 下流runnerが読める最小JSONになっている | 自由作文ではなくschema固定 | OK |
| B11 | 外部consumer検証 | 出力を受け取る側から評価する | parse、必須field、静的検証、期待値比較がある | OK |

## 重要な判断条件

| 判断 | 条件 | 理由 |
|---|---|---|
| 0.6Bを比較に残す | 短い分類・JSON整形の下限確認をする | 長い構造化生成は既存実測で品質対コストが見合いにくい |
| 3B-4Bを比較の中心に置く | local実行と品質の両立を試す場合 | 4bit量子化なら現実的なRAMに収まりやすい |
| 7B以上へ上げる | 評価理由、分解、自己チェックの品質差を見たい場合 | 推論品質は上がるが運用コストも上がる |
| 20B級を使う | reasoning品質が明確に必要な場合 | 小型ではないため常用コストを先に測る |
| LLM出力を確定扱いする | しない | 根拠なし推論を事実として保存しない |

## 受け入れ条件

次の条件を満たしたら、開発準備ドキュメントとして受け入れる。

| 条件 | 内容 |
|---|---|
| AC1 | モデル候補にライセンス確認欄がある |
| AC2 | field lineageのJSON例がある |
| AC3 | LLM担当範囲と静的解析担当範囲が分かれている |
| AC4 | 誤推論、データ漏洩、ライセンス誤認の残リスクがある |
| AC5 | 次に作るrunnerやfixtureの形が分かる |

## 残リスク

| リスク | 内容 | 次の確認 |
|---|---|---|
| RISK1 | 公開ページのライセンス表示が更新される可能性 | 採用直前にmodel cardとLICENSEを再確認 |
| RISK2 | GGUF量子化版と元modelのライセンス・性能が一致しない可能性 | 元modelと配布者を分けて記録 |
| RISK3 | 小型LLMがfieldの意味を取り違える可能性 | fixtureで正解比較し、低confidenceを落とす |
| RISK4 | ローカル推論でもログやcacheへprivate情報が残る可能性 | 保存先、ログmask、削除手順を運用設計へ入れる |
| RISK5 | 大きいpromptで失敗した結果から小型モデル全体を早く見切る可能性 | micro-context / minimal-output caseで再評価する |
