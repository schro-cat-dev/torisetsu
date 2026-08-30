# Execution Completion Record Schema

作成日: 2026-08-31

## 目的

1つの作業単位が終わった時に、完了条件、品質チェック、見積もり、証跡、修正コストを保存する。

## schemaVersion

`execution-completion-record.v1`

## 最小field

```json
{
  "schemaVersion": "execution-completion-record.v1",
  "task": {
    "taskId": "2026-08-31.model-drift.runner",
    "title": "モデルドリフト差分判定runner初版",
    "estimatedMinutes": 60,
    "actualMinutes": 45
  },
  "completion": {
    "doneCriteriaMet": true,
    "doneCriteria": "fixtureでrunnerがPASS結果JSONを出す"
  },
  "quality": {
    "requiredChecksPassed": true,
    "checks": ["node execution", "node --check", "git diff --check"]
  },
  "evidence": {
    "verificationRecorded": true,
    "commands": []
  },
  "focus": {
    "scopeDriftCount": 0
  },
  "speed": {
    "estimateOverrunRate": 0
  },
  "revision": {
    "userRevisionRequestCount": 0
  },
  "nextLoop": {
    "singleNextAction": true,
    "nextAction": "smoke 5件を実ケース化する"
  }
}
```
