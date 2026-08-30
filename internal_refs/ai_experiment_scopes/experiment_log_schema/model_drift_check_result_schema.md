# Model Drift Check Result Schema

作成日: 2026-08-31

## 目的

baseline観測値と今回観測値を比較した判定結果を保存する。

## schemaVersion

`model-drift-check-result.v1`

## 最小field

```json
{
  "schemaVersion": "model-drift-check-result.v1",
  "generatedAt": "2026-09-01T09:10:00+09:00",
  "configPath": "internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/configs/smoke-drift-check.config.json",
  "baselineRunId": "2026-08-31.smoke.gpt-5.6-sol",
  "currentRunId": "2026-09-01.smoke.gpt-5.6-sol",
  "status": "OK",
  "metrics": {
    "contractPassRateDrop": 0,
    "sourceTraceRateDrop": 0.03,
    "taskScoreDrop": 3,
    "tokenIncreaseRate": 0.1,
    "latencyIncreaseRate": 0.15,
    "falseRefusalOrFallbackRate": 0,
    "humanRevisionMinutesIncreaseRate": 0.1,
    "criticalUnsupportedClaims": 0,
    "conclusionConflictCount": 0
  },
  "checks": [],
  "actionItems": []
}
```

## 判定

- `checks[].passed` が全てtrueなら `OK`。
- 失敗したcheckがある場合、最も重い `severity` を `status` にする。
- `ACTION` または `BLOCK` は、初版configでは非ゼロ終了にする。
