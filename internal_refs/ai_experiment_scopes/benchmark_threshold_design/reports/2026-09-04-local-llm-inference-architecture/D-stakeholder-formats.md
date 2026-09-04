# D. ステークホルダー別フォーマット

## 目的

同じ調査結果を、見る人ごとに迷わず使える形へ分ける。

## 読者別の見る場所

| ステークホルダー | 知りたいこと | 見る文書 | 判断 |
|---|---|---|---|
| ユーザー | どのモデルから試すか | A, C3 | 0.6B/1.7B/3B/4B/7Bを同じmicro-caseで比較 |
| ハーネス開発者 | 何を入力・出力にするか | C1, C3 | JSON契約とrunnerを作る |
| セキュリティ確認者 | 情報漏洩とsecret混入をどう防ぐか | B, C1 | maskingとprivate情報停止条件を見る |
| ライセンス確認者 | 使ってよいモデルか | E | model IDごとにLICENSE確認 |
| 評価担当 | 何を測ればよいか | B, C3 | JSON成功率、分類精度、速度、RAMを見る |

## 報告フォーマット

### モデル比較候補の1行報告

```text
model=<model id> / size=<params> / license=<license> / runtime=<local api or llama.cpp> / result=<adopt|hold|reject> / reason=<短い理由>
```

例:

```text
model=SmolLM3-3B-Q4_K_M / size=3B / license=Apache-2.0 / runtime=llama.cpp / result=hold / reason=field lineage fixtureの実測前
```

### 評価結果の最低項目

| 項目 | 内容 |
|---|---|
| modelId | 実行した正確なモデルID |
| license | model cardとLICENSEの確認結果 |
| quantization | Q4_K_M、Q8_0など |
| runtime | Ollama、llama.cpp、Transformers、vLLMなど |
| inputCaseCount | 評価case数 |
| jsonPassRate | JSONとして読めた割合 |
| classificationAccuracy | field分類の正解率 |
| unsupportedRate | `AMBIGUOUS` / `UNVERIFIED` の割合 |
| avgLatencySeconds | 平均応答時間 |
| maxRamGb | 最大RAM |
| decision | `adopt`、`hold`、`reject` |

## 説明時の禁止

| 禁止 | 理由 |
|---|---|
| `小型でも十分` とだけ書く | 何に十分か分からない |
| `安全` と断定する | ログ、cache、依存、ライセンスが別リスク |
| `OSSだから自由` と書く | open-weightでも独自ライセンスがある |
| `推論できたので正しい` とする | field lineageは証跡検証が必要 |
