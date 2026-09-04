# F. 認識すり合わせ・PDCA

## 目的

ユーザー指摘により、モデル採用判断や性能十分性の見方が早くなりすぎないように、修正内容を記録する。

## ログ

| 日時 | ずれの内容 | 要因分析 | 修正・行動案 | 結果 | PDCA |
|---|---|---|---|---|---|
| 2026-09-04 | 3B-4Bを主候補にする表現が、性能十分性の判断として早く見える | 既存の実測が0.6B長文prompt寄りだったため、micro-context / minimal-outputでの再評価条件が不足していた | `採用候補` を `比較候補` に寄せ、context最小化、output最小化、外部consumer検証、他モデル比較キューを追加する | A/B/C1/C3/INDEXへ反映 | Check |

## 次の行動

| 優先 | 行動 | 完了条件 |
|---:|---|---|
| 5 | micro-context fixtureを3件作る | C0/C1/C2の入力JSONと期待出力JSONがある |
| 5 | 同じfixtureを複数モデルに流す | modelごとに `jsonPassRate`、`latency`、`classificationAccuracy` が出る |
| 4 | external consumer checkerを作る | LLM出力をschema parseし、保存可能性を判定できる |
| 3 | fine-tuning用データ形式を決める | LoRA/QLoRA用のinput/output pairが定義される |
