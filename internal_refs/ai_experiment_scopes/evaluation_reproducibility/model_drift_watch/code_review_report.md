# モデルドリフト監視ツール コードレビューレポート

作成日: 2026-08-31

## 目的

この文書は、`model_drift_watch` の実装をレビューする人が、次を判断するためのものです。

- ツール本体が個別caseやmodelに依存しすぎていないか。
- 正しい順序で処理されているか。
- raw outputからobservation、drift checkへつながるか。
- どこまで検証済みで、どこが未実装か。

## 対象

| 種類 | path |
|---|---|
| case set | `internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/cases/smoke.v1.json` |
| raw output fixture | `internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/fixtures/raw-run-ok.json` |
| grader config | `internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/configs/grader-fixture-ok.config.json` |
| grader runner | `internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/tools/run-model-drift-grader.mjs` |
| observation schema config | `internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/configs/observation-schema-check.config.json` |
| observation schema checker | `internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/tools/check-model-drift-observation.mjs` |
| drift check config | `internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/configs/smoke-drift-check.config.json` |
| drift check runner | `internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/tools/run-model-drift-check.mjs` |
| proposal generator | `internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/tools/run-model-drift-proposal-generator.mjs` |
| OpenAI adapter | `internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/tools/run-openai-model-drift-adapter.mjs` |
| Claude adapter | `internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/tools/run-claude-model-drift-adapter.mjs` |

## 処理順

この順序を守る。

```text
raw output fixture
  -> grader
  -> observation schema check
  -> 比較runner
  -> proposal
  -> adapter
```

今回の修正前/修正後:

| 項目 | 内容 |
|---|---|
| 修正前 | `graderが未実装なので、adapterはraw run logとSKIPだけ出す` としてadapterへ進もうとした |
| 問題 | adapter出力がobservationへ変換できるか検証できず、後続のdrift checkへ接続できない |
| 修正後 | raw output fixture、grader、observation schema checkを先に作り、PASSを確認してから後工程へ進む |
| 守る条件 | 後工程へ進む前に、前工程の成果物、検証コマンド、結果ファイルが揃っていること |

## 内部処理

### `run-model-drift-grader.mjs`

| 処理 | 入力 | 出力 | 失敗条件 |
|---|---|---|---|
| config読み込み | `model-drift-grader-config.v1` | 正規化前config | schemaVersion違い、必須field欠落 |
| case set読み込み | `caseSetFile` | case一覧 | `model-drift-case-set.v1` でない、cases欠落 |
| raw run読み込み | `rawRunFile` | raw case一覧 | `model-drift-raw-run.v1` でない、runId/model欠落 |
| case照合 | caseId | caseごとのraw output | case欠落、未知caseId |
| contract採点 | `expectedContract` と `outputText` | `contractPassed` | JSON parse失敗、required field欠落、extra field混入、型違い |
| source trace採点 | `sourceTraceRequired`, `allowedSourceIds` | `sourceTraceRate`, `criticalUnsupportedClaims` | claimにsource idがない、許可外source id |
| rubric採点 | `grading.rubric`, `manualRubricScores` | `taskRubricScore` | passScore未満、score欠落 |
| cost/latency集計 | `usage`, `latencyMs` | `totalTokens`, `latencyMs` | token上限超過 |
| refusal/fallback検出 | `status`, `stopReason` | `refusalOrFallbackRate` | 正当caseでREFUSAL/FALLBACK |
| 人間修正時間集計 | `humanRevision` | `humanRevisionMeasured`, `humanRevisionMinutes` | 未測定の場合は0扱いにしない |
| JSON保存 | `output.observationFile`, `output.graderResultFile` | observation、grader result | 書き込み失敗 |

### `check-model-drift-observation.mjs`

| 処理 | 入力 | 出力 | 失敗条件 |
|---|---|---|---|
| config読み込み | `model-drift-observation-schema-check-config.v1` | 検査条件 | schemaVersion違い、必須field欠落 |
| observation読み込み | `targetFile` | observation | JSON parse失敗 |
| top-level検査 | `requiredTopLevelFields` | passed/failed checks | 必須field欠落 |
| model検査 | `requiredModelFields` | model field結果 | provider/name/settings欠落 |
| grader検査 | `requiredGraderFields` | grader field結果 | graderId/configPath欠落 |
| metric検査 | `numericMetrics`, `booleanMetrics`, `rateMetrics`, `integerMetrics` | metric結果 | 型違い、rate範囲外、integerでない |
| JSON保存 | `output.file` | schema check result | 書き込み失敗 |

### `run-model-drift-check.mjs`

| 処理 | 入力 | 出力 | 失敗条件 |
|---|---|---|---|
| baseline/current読み込み | observation JSON 2件 | 比較対象 | observation schemaVersion違い、metrics欠落 |
| 差分計算 | baseline.metrics, current.metrics | comparison metrics | 数値でないmetric |
| しきい値判定 | `thresholds[]` | checks[] | operator不正、metric欠落 |
| status決定 | failed checks | `OK/WATCH/ACTION/BLOCK` | severity不正 |
| action抽出 | `actions[]` | actionItems | statusに対応するactionなし |
| JSON保存 | `output.file` | check result | 書き込み失敗 |

### `run-model-drift-proposal-generator.mjs`

| 処理 | 入力 | 出力 | 失敗条件 |
|---|---|---|---|
| config読み込み | `model-drift-proposal-generator-config.v1` | proposal生成条件 | schemaVersion違い、必須field欠落 |
| check result読み込み | `source.checkResultFile` | failed checks | `model-drift-check-result.v1` でない |
| status確認 | `allowedSourceStatuses` | 生成可否 | `ACTION/BLOCK` 以外などconfigで許可されていないstatus |
| rule照合 | `rules[].checkId` | proposal項目 | failed checkに対応するruleがない |
| target分類 | `prompt/schema/routing/threshold` | `proposals[].target` | targetが許可値でない |
| JSON保存 | `output.proposalFile` | `model-drift-action-proposal.v1` | 書き込み失敗 |

### `run-openai-model-drift-adapter.mjs`

| 処理 | 入力 | 出力 | 失敗条件 |
|---|---|---|---|
| config読み込み | `model-drift-adapter-config.v1` | OpenAI実行条件 | provider違い、model/endpoint欠落 |
| case set読み込み | `caseSetFile` | prompt一覧 | case set不正 |
| SKIP判定 | `executionMode`, `apiKeyEnv` | SKIP raw run | `executionMode: skip` またはAPI keyなし |
| API実行 | Responses API | caseごとのraw output | HTTP error、fetch error |
| usage変換 | OpenAI usage | input/output/total tokens | usage欠落時は0 |
| JSON保存 | `output.rawRunFile` | `model-drift-raw-run.v1` | 書き込み失敗 |

### `run-claude-model-drift-adapter.mjs`

| 処理 | 入力 | 出力 | 失敗条件 |
|---|---|---|---|
| config読み込み | `model-drift-adapter-config.v1` | Claude実行条件 | provider違い、model/endpoint/version欠落 |
| case set読み込み | `caseSetFile` | prompt一覧 | case set不正 |
| SKIP判定 | `executionMode`, `apiKeyEnv` | SKIP raw run | `executionMode: skip` またはAPI keyなし |
| API実行 | Messages API | caseごとのraw output | HTTP error、fetch error |
| usage変換 | Anthropic usage | input/output/total tokens | usage欠落時は0 |
| JSON保存 | `output.rawRunFile` | `model-drift-raw-run.v1` | 書き込み失敗 |

## 汎用性評価

| 観点 | 現状 | 評価 | 理由 |
|---|---|---|---|
| case差し替え | configの `caseSetFile` で差し替える | OK | runner本体に5caseのcaseIdは直書きしていない |
| raw run差し替え | configの `rawRunFile` で差し替える | OK | fixture、将来adapter出力のどちらも同じraw run schemaで読める |
| 出力先差し替え | configの `output.*File` で差し替える | OK | observation/grader result/schema check resultの保存先はconfig側 |
| 採点項目 | case JSONの `expectedContract` と `grading` で差し替える | 一部OK | required fields、型、extra fields、source trace、rubricはcase側。採点ロジックの種類追加はrunner変更が必要 |
| しきい値 | drift check configの `thresholds[]` で差し替える | OK | threshold値、severity、messageはconfig側 |
| provider/model | raw runの `provider`, `model`, `modelGroup` を読む | OK | runnerは特定provider APIを知らない |
| status fixture | OK/WATCH/ACTION/BLOCKの4種類 | OK | status別fixtureとconfigを追加し、4種類を実行済み |
| proposal | ACTION/BLOCK入力からproposal生成 | OK | failed check IDをconfig rulesでtargetへ変換する |
| adapter | OpenAI/Claude adapterとSKIP証跡 | 一部OK | 実装とSKIP実行は完了。API keyありのlive実行は未検証 |

## 直書き確認ポイント

レビュー時は、runner本体に次が混ざっていないかを見る。

| NG対象 | 入れる場所 |
|---|---|
| 個別caseId | case JSON、fixture |
| 対象model名 | raw run、run config |
| 保存先path | config |
| しきい値 | drift check config |
| provider API endpoint | adapter configまたはadapter実装。ただしobservation schemaは守る |
| 人間修正時間の初期値 | raw run。未測定は0ではなく `measured: false` |

現時点でrunnerに残してよい固定値:

- `schemaVersion`
- 必須field名
- 許可status名
- 汎用metric名
- 結果schema名

## API実装メモ

| provider | 使うAPI | この実装で使う主なfield | 参照 |
|---|---|---|---|
| OpenAI | Responses API | `model`, `input`, `max_output_tokens`, `temperature`, `reasoning.effort`, `store` | `https://developers.openai.com/api/reference/cli/resources/responses/methods/create` |
| Anthropic | Messages API | `model`, `max_tokens`, `temperature`, `messages`, `anthropic-version` | `https://platform.claude.com/docs/en/api/messages/create` |

注意:

- API endpoint、model名、max token、temperatureはconfig側に置く。
- adapter本体はraw runを出す。採点はgraderへ渡す。
- live API実行は未検証。現在の証跡は `executionMode: skip` による外部API未実行のSKIP確認。

## 検証済み証跡

| 確認 | コマンド | 実結果 |
|---|---|---|
| grader構文 | `node --check internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/tools/run-model-drift-grader.mjs` | exit 0 |
| observation checker構文 | `node --check internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/tools/check-model-drift-observation.mjs` | exit 0 |
| drift check構文 | `node --check internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/tools/run-model-drift-check.mjs` | exit 0 |
| case schema check | `node internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/tools/check-model-drift-cases.mjs internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/configs/case-schema-check.config.json` | `PASS`, `failedCheckCount: 0` |
| grader実行 | `node internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/tools/run-model-drift-grader.mjs internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/configs/grader-fixture-ok.config.json` | `PASS`, `failedCaseCount: 0` |
| observation schema check | `node internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/tools/check-model-drift-observation.mjs internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/configs/observation-schema-check.config.json` | `PASS`, `failedCheckCount: 0` |
| drift check | `node internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/tools/run-model-drift-check.mjs internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/configs/smoke-drift-check.config.json` | `OK`, `failedChecks: []` |
| status fixture OK | `node internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/tools/run-model-drift-check.mjs internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/configs/status-fixture-ok.config.json` | `OK`, `failedChecks: []` |
| status fixture WATCH | `node internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/tools/run-model-drift-check.mjs internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/configs/status-fixture-watch.config.json` | `WATCH`, `model_drift.source_trace_rate_drop` |
| status fixture ACTION | `node internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/tools/run-model-drift-check.mjs internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/configs/status-fixture-action.config.json` | `ACTION`, `model_drift.contract_pass_rate_drop` |
| status fixture BLOCK | `node internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/tools/run-model-drift-check.mjs internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/configs/status-fixture-block.config.json` | `BLOCK`, `model_drift.critical_unsupported_claims` |
| ACTION proposal | `node internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/tools/run-model-drift-proposal-generator.mjs internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/configs/proposal-action.config.json` | `PASS`, `proposalCount: 1`, `target: schema` |
| BLOCK proposal | `node internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/tools/run-model-drift-proposal-generator.mjs internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/configs/proposal-block.config.json` | `PASS`, `proposalCount: 1`, `target: prompt` |
| OpenAI adapter SKIP | `node internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/tools/run-openai-model-drift-adapter.mjs internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/configs/openai-adapter-skip.config.json` | `SKIP`, `caseCount: 5`, `skipReason: executionMode=skip` |
| Claude adapter SKIP | `node internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/tools/run-claude-model-drift-adapter.mjs internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/configs/claude-adapter-skip.config.json` | `SKIP`, `caseCount: 5`, `skipReason: executionMode=skip` |

生成された主な証跡:

| 種類 | path | 主要値 |
|---|---|---|
| grader result | `internal_refs/ai_experiment_scopes/benchmark_threshold_design/experiments/model_drift_watch/grader_results/2026-08-31.smoke.fixture.ok.grader-result.json` | `caseCount: 5`, `failedCaseCount: 0` |
| observation | `internal_refs/ai_experiment_scopes/benchmark_threshold_design/experiments/model_drift_watch/observations/2026-08-31.smoke.fixture.ok.observation.json` | `contractPassRate: 1`, `sourceTraceRate: 1`, `taskRubricScore: 100`, `totalTokens: 1588`, `latencyMs: 8000`, `humanRevisionMinutes: 1` |
| observation check | `internal_refs/ai_experiment_scopes/benchmark_threshold_design/experiments/model_drift_watch/schema_checks/2026-08-31.smoke-fixture-observation-schema-check.result.json` | `PASS`, `checkedMetricCount: 10` |
| drift check result | `internal_refs/ai_experiment_scopes/benchmark_threshold_design/experiments/model_drift_watch/smoke-drift-check.result.json` | `OK`, `failedChecks: []` |
| status fixtures | `internal_refs/ai_experiment_scopes/benchmark_threshold_design/experiments/model_drift_watch/status_fixtures/` | OK/WATCH/ACTION/BLOCKを再現 |
| proposals | `internal_refs/ai_experiment_scopes/benchmark_threshold_design/experiments/model_drift_watch/proposals/` | ACTIONは`schema`、BLOCKは`prompt` |
| adapter skip raw runs | `internal_refs/ai_experiment_scopes/benchmark_threshold_design/experiments/model_drift_watch/raw_runs/` | OpenAI/Claudeとも`SKIP` |

## 未完了

| 項目 | 理由 | 次の完了条件 |
|---|---|---|
| OpenAI adapter live実行 | API key付き外部API実行は未実施 | `executionMode: auto` と `OPENAI_API_KEY` でraw runを生成し、graderへ接続する |
| Claude adapter live実行 | API key付き外部API実行は未実施 | `executionMode: auto` と `ANTHROPIC_API_KEY` でraw runを生成し、graderへ接続する |
| 人間rubricの自動化 | 現時点は `manualRubricScores` をfixtureへ入れている | rubric自動採点か、人間採点入力UI/記録形式を決める |

## レビュー時の判断

| 判断 | OK条件 |
|---|---|
| 汎用runnerとして見てよいか | 新しいcase setやraw runをconfig差し替えで実行でき、runner本体にcase固有値が増えない |
| observationを比較runnerへ渡してよいか | observation schema checkが `PASS` |
| adapterへ進んでよいか | raw output fixture、grader、observation schema check、比較runner、proposalの順に証跡が揃っている |
| v1完了と言ってよいか | `v1_completion_contract.md` の V1-01 から V1-10 が全て証跡付きで完了 |
