# 実験ログ形式

## 目的

AI実験の記録形式をそろえ、後から比較できるようにする。

## 最小テンプレート

~~~markdown
# <実験ID>

## 目的

<何を確認するか>

## 仮説

<どの入力で、どの出力が変わると思うか>

## 条件

- 日付:
- モデル/環境:
- tool:
- repo状態:
- 期限:
- 制約:

## 入力

```text
<実際のプロンプト>
```

## 出力

<AIの回答、作業、差分、生成物>

## 評価

| 観点 | 結果 | メモ |
|---|---|---|
| 正確性 |  |  |
| 完了度 |  |  |
| ノイズ量 |  |  |
| 修正コスト |  |  |
| 再現性 |  |  |

## 次の改善

<次に変える入力や制約>
~~~

## 管理ルール

- 実験ごとに1ファイルにする。
- 入力文はできるだけ原文のまま残す。
- AIの解釈や評価は、入力とは別欄に書く。
- 成功例だけでなく、失敗例も残す。

## 個別テンプレート

| テンプレート | 用途 |
|---|---|
| `model_eval_result_schema.md` | モデル比較runのJSON形式 |
| `individual_model_module_eval_log.md` | 特定モジュールを複数モデルで設計・実装比較するログ |
| `model_drift_watch_observation_schema.md` | モデルドリフト判定前の1回分の実行観測値 |
| `model_drift_check_result_schema.md` | baseline/current観測値を比較した判定結果 |
| `execution_completion_record_schema.md` | 作業単位完了時の完了条件、品質、見積もり、証跡、修正コスト |
| `execution_completion_score_result_schema.md` | 完了記録を採点した結果 |
