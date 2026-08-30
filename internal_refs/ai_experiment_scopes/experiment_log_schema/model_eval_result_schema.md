# Model Eval Result Schema

作成日: 2026-08-31

## 目的

モデル比較の出力を同じ形で保存し、後で合格率、ブレ、費用、修正時間を比較できるようにする。

## schemaVersion

`model-eval-result.v1`

## 必須field

```json
{
  "schemaVersion": "model-eval-result.v1",
  "runId": "2026-08-31T090000+09:00.gpt-5.6-sol.fact_research.current_models.001.r1",
  "model": "gpt-5.6-sol",
  "settings": {
    "reasoningEffort": "high",
    "temperature": 0
  },
  "caseId": "fact_research.current_models.001",
  "passed": false,
  "scores": {
    "contractPass": 1,
    "sourceTraceRate": 0.92,
    "taskRubricScore": 0.78
  },
  "violations": [
    {
      "policyId": "critical_unsupported_claim",
      "severity": "HIGH",
      "message": "公開根拠がない内部アーキテクチャを断定した"
    }
  ],
  "cost": {
    "inputTokens": 12000,
    "outputTokens": 3000,
    "usd": 0.108
  },
  "latencyMs": 42000,
  "humanReview": {
    "minutes": 12,
    "revisionCount": 3
  },
  "evidence": {
    "sourceUrls": [
      "https://developers.openai.com/api/docs/models/gpt-5.6-sol"
    ],
    "commands": [],
    "notes": "未実行項目があればここに書く"
  },
  "residualRisks": [
    "API価格やavailabilityは更新される可能性がある"
  ]
}
```

## 判定ルール

| field | 条件 |
|---|---|
| `schemaVersion` | `model-eval-result.v1` と完全一致 |
| `runId` | 日付、model、caseId、run番号を含む |
| `passed` | 全critical gate通過時だけ `true` |
| `scores.contractPass` | `1` が通過、`0` が不通過 |
| `violations[].severity` | `HIGH`, `MEDIUM`, `LOW` のいずれか |
| `evidence.sourceUrls` | 事実claimがある場合は1件以上 |
| `residualRisks` | 空配列可。ただし未検証事項がある場合は必須 |

## 注意

このschemaは記録形式であり、runner実装ではない。runnerを作る場合は、対象pathやcase一覧をrunnerに直書きせず、case JSONやmanifestから読む。
