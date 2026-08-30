# Model Drift Watch 実行結果

## 目的

同じモデル名・同じcase・同じ設定で定期実行した結果を保存し、前回baselineとの差分を比較する。

## 保存するもの

| 項目 | 内容 |
|---|---|
| watchRunId | 定期実行ID |
| model | 使用モデル |
| caseSet | 実行したcase集合 |
| environment | repo commit、tool、network、sandbox |
| metrics | contract、source、unsupported claim、token、latency、修正時間 |
| drift status | OK/WATCH/ACTION/BLOCK |
| actions | prompt、model routing、しきい値、作業ルールへの反映 |

## ファイル名

```text
YYYY-MM-DD-<watchType>-<model>.json
```

例:

```text
2026-09-01-weekly-gpt-5.6-sol.json
```

## 初回実行

初回はbaselineがないため、schema上の `drift.status` は `OK` とし、`drift.summary` に `BASELINE_CREATED` 相当のメモを書く。`baseline.baselineRunId` と `baseline.baselineDate` は `null` にする。空文字は使わない。
