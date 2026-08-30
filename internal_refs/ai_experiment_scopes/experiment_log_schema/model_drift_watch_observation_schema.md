# Model Drift Watch Observation Schema

作成日: 2026-08-31

## 目的

モデルドリフト判定前の、1回分の実行観測値を保存する。

## schemaVersion

`model-drift-watch-observation.v1`

## 最小field

```json
{
  "schemaVersion": "model-drift-watch-observation.v1",
  "runId": "2026-09-01.smoke.gpt-5.6-sol",
  "runAt": "2026-09-01T09:00:00+09:00",
  "watchType": "smoke",
  "model": {
    "provider": "openai",
    "name": "gpt-5.6-sol",
    "versionHint": "public model name",
    "settings": {
      "temperature": 0,
      "reasoningEffort": "high"
    }
  },
  "metrics": {
    "contractPassRate": 1,
    "sourceTraceRate": 0.97,
    "taskRubricScore": 86,
    "criticalUnsupportedClaims": 0,
    "totalTokens": 12000,
    "latencyMs": 42000,
    "refusalOrFallbackRate": 0,
    "humanRevisionMinutes": 15,
    "conclusionConflictCount": 0
  }
}
```

## 注意

- これは比較前の観測値。
- baselineとcurrentをこの形式で保存し、runnerが差分を計算する。
