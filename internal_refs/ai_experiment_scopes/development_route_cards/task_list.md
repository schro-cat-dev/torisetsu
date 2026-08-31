# Development Route Cards することリスト

作成日: 2026-08-31

## 目的

作業タイプ別の進行route、support mode、品質gateを小さく作り、TODOアプリで検証する。

## 実行順

| 順 | ID | タスク | 優先度 | 想定時間 | 完了条件 | 証跡 |
|---:|---|---|---:|---:|---|---|
| 1 | DRC-T01 | route card schemaを作る | 5 | 45分 | `development-route-card.v1` の必須field、許可値、NG例がある | schema draft |
| 2 | DRC-T02 | UI feature追加routeをJSON化する | 5 | 45分 | READMEのUI routeがJSONで再現される | `routes/ui-feature-add.v1.json` |
| 3 | DRC-T03 | API endpoint追加routeをJSON化する | 5 | 45分 | request、response、contract、権限、検証がgate化される | `routes/api-endpoint-add.v1.json` |
| 4 | DRC-T04 | DB変更routeをJSON化する | 4 | 45分 | schema、migration、rollback、contract影響がgate化される | `routes/db-change.v1.json` |
| 5 | DRC-T05 | support mode profileを作る | 5 | 1時間 | `learner/checklist/evidence` の表示差分がconfig化される | `support_modes/*.json` |
| 6 | DRC-T06 | route card checkerを作る | 5 | 1.5時間 | route JSON不足を落とし、結果JSONを出す | checker result |
| 7 | DRC-T07 | TODOアプリのUI追加で試行する | 5 | 2時間 | 同じタスクをrouteあり/なしで比較できる | experiment log |
| 8 | DRC-T08 | friction log schemaを作る | 5 | 45分 | 修正回数、詰まり時間、追加指示回数、gate pass rateを記録できる | schema draft |
| 9 | DRC-T09 | AI promptへroute cardを差し込む手順を書く | 4 | 45分 | AIに渡す入力例と出力例がある | prompt sample |
| 10 | DRC-T10 | 結果をbenchmarkへ接続する | 4 | 1時間 | `harness_effectiveness` の指標へ写せる | mapping table |

## 最初に作る範囲

最初に作る範囲は `DRC-T01`、`DRC-T02`、`DRC-T06`、`DRC-T07` に絞る。

理由:

- schemaがないとroute cardの品質が揺れる。
- UI routeはTODOアプリで試しやすい。
- checkerがないと、route cardが説明文だけで終わる。
- 試行しないと、補助輪として効いているか分からない。

## 試行入力

```json
{
  "taskId": "todo-ui-filter-reset-button",
  "routeId": "ui.feature.add.v1",
  "supportMode": "learner",
  "qualityLevel": "minimum pass",
  "userGoal": "フィルタ条件を1操作で初期状態へ戻せる",
  "targetScreen": "TodoPage",
  "stateChange": "filter state resets to all/default",
  "validationRules": [],
  "doneCriteria": [
    "reset button is visible when filters are changed",
    "click resets filters",
    "evidence is recorded"
  ]
}
```

## 試行出力

```json
{
  "schemaVersion": "development-route-run-result.v1",
  "taskId": "todo-ui-filter-reset-button",
  "routeId": "ui.feature.add.v1",
  "supportMode": "learner",
  "qualityLevel": "minimum pass",
  "gateResults": [
    {
      "gateId": "UI-01",
      "status": "PASS",
      "evidence": "user action: click reset -> filters reset"
    }
  ],
  "metrics": {
    "revisionRequestCount": 0,
    "blockedMinutes": 0,
    "aiClarificationCount": 1,
    "gatePassRate": 1,
    "humanOnlyFindingCount": 0
  },
  "nextProposal": {
    "target": "route",
    "reason": "No blocker in trial run",
    "changeSummary": "No route change"
  }
}
```

## 完了判定

このタスク群は、次がそろった時に初版完了とする。

- route card schemaがある。
- UI/API/DB route JSONがある。
- support mode profileがある。
- route card checkerがある。
- TODOアプリ試行のrun resultがある。
- friction logがある。
- benchmarkへの写し方がある。

## やらないこと

- 初版で全作業タイプを網羅しない。
- 初版で外部SaaSやcloudへ接続しない。
- 初版で人の能力スコアを作らない。
- route cardなしの自由開発を禁止しない。

## 残リスク

| リスク | 内容 | 対応 |
|---|---|---|
| 補助量が多すぎる | learner modeが読む負担になる | 試行でblockedMinutesを見る |
| gateが弱い | 通っても品質が上がらない | humanOnlyFindingCountを見る |
| gateが強すぎる | 小さい変更でも重くなる | qualityLevelで調整する |
| AIがrouteを無視する | promptに入れても実装順序がズレる | route checkerとrun resultで落とす |
| 教育寄りになりすぎる | 作業速度が落ちる | 目的は開発完了で、学習は補助として扱う |
