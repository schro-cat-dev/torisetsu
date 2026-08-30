# モデルドリフト監視 v1 完了契約

作成日: 2026-08-31

## 結論

前回の「最小v1」は粗く、完了条件として使えない。v1は、下の条件を全部満たした時だけ完了扱いにする。

この文書は完了条件を定義する。仕組みの芯は `core_design.md` に置く。

## このv1は何を完成させるものか

モデルドリフト監視v1は、OpenAI/Claudeの対象モデルへ同じsmoke caseを投げ、前回baselineとの差分を同じ指標で見て、運用判断と改善案をJSONで残す最小実装です。

完成後は、次の質問に答えられる。

| 質問 | v1で出す答え |
|---|---|
| 今日の対象モデルは前回より悪化したか | `OK/WATCH/ACTION/BLOCK` |
| 何が悪化したか | contract、source trace、task score、token、latency、refusal/fallback、人間修正時間 |
| どの作業に影響するか | case categoryとfailed checks |
| 次に何を直すか | `prompt/schema/routing/threshold` のproposal |
| 判断根拠は後から追えるか | raw output、observation、check result、proposal |

## v1の目的

同じモデル名を使い続けても、出力品質、形式、根拠、コスト、時間、拒否/fallback、人間修正時間の変化を定期的に検知し、採用モデル、prompt、schema、routing、しきい値の改善判断へ戻せるようにする。

## v1対象モデル

初期の実行対象は、次のmodel groupです。全てを同時に実API実行できない場合でも、config上で対象として表現し、API keyや利用可否がないものは `SKIP` を明示する。

| group | provider | model | 比較上の役割 | 必須設定 |
|---|---|---|---|---|
| `openai.high` | OpenAI | `gpt-5.6-sol` | 高性能baseline | `temperature: 0`, reasoning effort固定 |
| `openai.mid` | OpenAI | `gpt-5.6-terra` | 中間cost候補 | `temperature: 0`, reasoning effort固定 |
| `openai.low` | OpenAI | `gpt-5.6-luna` | 安価routing候補 | `temperature: 0`, reasoning effort固定 |
| `openai.compare` | OpenAI | `gpt-5.5` | 利用可能なら旧/別baseline | API availability確認 |
| `anthropic.high` | Anthropic | `claude-opus-5` | Claude高性能baseline | `temperature: 0` 相当、effort固定 |
| `anthropic.top` | Anthropic | `claude-fable-5` | Claude高cost候補 | effort固定、fallback/拒否記録 |

run configには、最低でも `provider`, `model`, `modelGroup`, `settings`, `caseSetFile`, `output` を持たせる。

## v1の入力と出力

| 種類 | path例 | 説明 |
|---|---|---|
| case set | `cases/smoke.v1.json` | 5件の固定入力、期待contract、grader項目 |
| run config | `configs/runs/*.json` | provider、model、settings、case set、保存先 |
| raw output | `raw_runs/<runId>.json` | モデルの生出力、usage、latency、stop reason |
| observation | `observations/<runId>.json` | 採点済みmetrics |
| check result | `checks/<runId>.json` | baseline/current比較結果 |
| proposal | `proposals/<runId>.json` | ACTION/BLOCK時の修正案 |

## v1の合格ライン

v1を「できた」と言えるのは、次が全部満たされた時だけです。

| 種類 | 合格ライン |
|---|---|
| 再実行性 | smoke 5件を同じpromptで再実行できる |
| schema | case、raw output、observation、check result、proposalがJSON parseできる |
| 判定 | OK/WATCH/ACTION/BLOCKをfixtureで全部再現できる |
| 実API | API keyなしは明示skip、API keyありはobservationを生成できる |
| 保存 | 実行結果が所定dirに残る |
| 改善接続 | ACTION/BLOCK時にprompt/schema/routing/thresholdのどれを直すか出る |
| 初見実行 | READMEのコマンドだけでfixture版を実行できる |

## 非ゴール

- 提供会社の内部更新内容を断定する。
- 公開ベンチ順位だけで採用モデルを決める。
- 1回の異常だけで本番運用を切り替える。
- `ACTION/BLOCK` 時に自動で大きなpatchを当てる。

## v1完了条件

| ID | 完了条件 | 判定方法 | 完了証跡 |
|---|---|---|---|
| V1-01 | smoke 5件のcase JSONがある | `cases/smoke.v1.json` がschema通り | case file |
| V1-02 | 各caseに固定prompt、期待output contract、grader項目がある | caseごとに `prompt`, `expectedContract`, `grading` がある | schema check result |
| V1-03 | OpenAI adapterで実modelを呼べる | env未設定時は明示skip、envありでobservation生成 | adapter run log |
| V1-04 | Claude adapterで実modelを呼べる | env未設定時は明示skip、envありでobservation生成 | adapter run log |
| V1-05 | 各runが `model-drift-watch-observation.v1` を出す | JSON parseと必須field check | observation JSON |
| V1-06 | 比較runnerが `model-drift-check-result.v1` を出す | baseline/current比較でstatus生成 | check result JSON |
| V1-07 | `OK/WATCH/ACTION/BLOCK` が再現できるfixtureがある | 4 status fixtureをrunnerで実行 | fixture result |
| V1-08 | `ACTION/BLOCK` 時にproposal JSONが出る | prompt/schema/routing/thresholdの分類がある | proposal JSON |
| V1-09 | 実行結果が所定dirに残る | `benchmark_threshold_design/experiments/model_drift_watch/` に保存 | result files |
| V1-10 | READMEに実行コマンドと残リスクがある | 初見で手動実行できる | README |

## V1-01/V1-02の最低品質

`cases/smoke.v1.json` は、存在するだけでは完了にしない。次を満たす必要がある。

| 項目 | OK条件 | NG例 |
|---|---|---|
| 対象 | LLM出力のドリフトを見るcaseである | 一般的な作文問題だけ |
| 固定入力 | prompt全文がcase JSONに入っている | READMEに概要だけ書く |
| 出力契約 | required fields、型、extra field可否がある | `JSONで返す` だけ |
| grader | contract/source/task/costなど何を採点するかがある | `良い回答か見る` だけ |
| 失敗検知 | 何が壊れたらNGか分かる | 合格条件だけで失敗例がない |
| 後続接続 | graderがobservation metricsへ変換できる | 人間が読むだけで終わる |

## smoke 5件

| caseId | 狙い | 入力 | 期待出力 | 主なgrader |
|---|---|---|---|---|
| `drift.contract.schema_convert.001` | 出力契約を守れるか | 固定の箇条書き要件 | 指定JSONだけ | JSON parse、required fields、extra fieldなし |
| `drift.source_trace.local_excerpt.001` | 根拠付き出力が崩れないか | source id付き短文3本 | claimごとにsource id | source trace rate、unsupported claims |
| `drift.task_plan.milestone_checklist.001` | 実務タスクをマイルストーンとチェックリストへ落とせるか | 小モジュール要件 | milestones、checklist、done criteria、risks | task rubric score、scope drift |
| `drift.ambiguity.no_guess.001` | 不足情報を勝手に補完しないか | 意図的に情報不足の依頼 | 不明点、仮定、最小提案 | unsupported claims、conclusion conflict |
| `drift.cost.concise_output.001` | tokenを増やしすぎないか | 短い設計依頼 | 指定上限内の回答 | token count、contract pass |

## case JSON最小形

```json
{
  "schemaVersion": "model-drift-case-set.v1",
  "caseSetId": "model-drift-smoke.v1",
  "cases": [
    {
      "caseId": "drift.contract.schema_convert.001",
      "category": "contract",
      "prompt": "<固定prompt>",
      "expectedContract": {
        "format": "json",
        "requiredFields": ["summary", "items", "risks"],
        "allowExtraFields": false
      },
      "grading": {
        "contractRequired": true,
        "sourceTraceRequired": false,
        "maxOutputTokens": 800,
        "rubric": [
          {
            "id": "task_fit",
            "maxScore": 5
          }
        ]
      }
    }
  ]
}
```

## adapter入力config

```json
{
  "schemaVersion": "model-drift-run-config.v1",
  "runId": "2026-09-01.smoke.openai.gpt-5.6-sol",
  "provider": "openai",
  "model": "gpt-5.6-sol",
  "caseSetFile": "internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/cases/smoke.v1.json",
  "settings": {
    "temperature": 0,
    "reasoningEffort": "medium",
    "maxOutputTokens": 1200
  },
  "output": {
    "observationFile": "internal_refs/ai_experiment_scopes/benchmark_threshold_design/experiments/model_drift_watch/observations/2026-09-01.smoke.openai.gpt-5.6-sol.json"
  }
}
```

## observation必須metrics

| metric | 型 | 作り方 |
|---|---|---|
| `contractPassRate` | 0..1 | caseごとのJSON契約通過数 / case数 |
| `sourceTraceRate` | 0..1 | source id付きclaim数 / claim数 |
| `taskRubricScore` | 0..100 | rubric合計を100点換算 |
| `criticalUnsupportedClaims` | integer | 重要claimで根拠なしの数 |
| `totalTokens` | integer | provider usageから取得 |
| `latencyMs` | integer | request開始から終了まで |
| `refusalOrFallbackRate` | 0..1 | 正当caseで拒否/fallbackした数 / case数 |
| `humanRevisionMinutes` | number | 人間が修正に使った分。未測定なら0ではなく別fieldで未測定扱い |
| `conclusionConflictCount` | integer | baselineと結論が矛盾したcase数 |

## proposal JSON最小形

```json
{
  "schemaVersion": "model-drift-action-proposal.v1",
  "sourceCheckResult": "<model-drift-check-result file>",
  "status": "ACTION",
  "proposals": [
    {
      "target": "prompt",
      "reason": "sourceTraceRateDrop exceeded threshold",
      "changeSummary": "source id必須条件をpromptに追加する",
      "requiresHumanApproval": true
    }
  ]
}
```

## v1実装タスク

この順序を守る。前工程が後工程の入力になるため、未実装・未検証の工程を飛ばして後工程を完了扱いにしない。

| 順 | タスク | 見積もり | 必要入力 | 完了条件 |
|---:|---|---:|---|---|
| 1 | `cases/smoke.v1.json` を作る | 45分 | 上の5case | schema通過 |
| 2 | case schema checkerを作る | 45分 | case JSON | OK/NGがJSONで出る |
| 3 | raw output fixtureを作る | 45分 | case JSON | grader入力になるraw run JSONがある |
| 4 | graderを作る | 2時間 | case JSON、raw run JSON | observation metricsを出せる |
| 5 | observation schema checkを作る | 45分 | observation JSON | 必須metricsと型を検証できる |
| 6 | 4 status fixtureを作る | 45分 | baseline/current例 | OK/WATCH/ACTION/BLOCK再現 |
| 7 | proposal generatorを作る | 1時間 | check result | proposal JSON生成 |
| 8 | OpenAI adapterを作る | 1.5時間 | `OPENAI_API_KEY`、model名、grader | raw runからobservationまで接続できる |
| 9 | Claude adapterを作る | 1.5時間 | `ANTHROPIC_API_KEY`、model名、grader | raw runからobservationまで接続できる |
| 10 | README更新 | 30分 | 実行コマンド | 初見で実行可能 |
| 11 | v1通し確認 | 1時間 | envまたはskip条件 | localで再現可能 |

## 現実的な残見積もり

- APIなしfixture版v1: 4〜6時間。
- OpenAI/Claude実API込みv1: 6〜9時間。
- 定期実行まで込み: 8〜12時間。

## blocker

| blocker | 影響 | 対応 |
|---|---|---|
| API keyなし | 実model呼び出し不可 | adapterはskip可能にし、fixtureで先に通す |
| 使うmodel未確定 | run configが確定しない | configで差し替え可能にする |
| 人間修正時間が未測定 | quality-cost評価が欠ける | 初期は手入力fieldにする |
| Web参照が絡むcase | 外部変化でdrift判定が濁る | smokeでは固定入力だけ使う |

## 完了判定

v1完了は、次が全部通った時だけ。

```bash
node internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/tools/check-model-drift-design-readiness.mjs internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/configs/design-readiness-check.config.json
node internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/tools/check-model-drift-cases.mjs internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/configs/case-schema-check.config.json
node internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/tools/run-model-drift-grader.mjs internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/configs/grader-fixture-ok.config.json
node internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/tools/check-model-drift-observation.mjs internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/configs/observation-schema-check.config.json
node internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/tools/run-model-drift-check.mjs internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/configs/status-fixture-ok.config.json
node internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/tools/run-model-drift-check.mjs internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/configs/status-fixture-watch.config.json
node internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/tools/run-model-drift-check.mjs internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/configs/status-fixture-action.config.json
node internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/tools/run-model-drift-check.mjs internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/configs/status-fixture-block.config.json
node internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/tools/run-model-drift-proposal-generator.mjs internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/configs/proposal-action.config.json
node internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/tools/run-model-drift-proposal-generator.mjs internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/configs/proposal-block.config.json
node internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/tools/run-openai-model-drift-adapter.mjs internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/configs/openai-adapter-skip.config.json
node internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/tools/run-claude-model-drift-adapter.mjs internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/configs/claude-adapter-skip.config.json
```

API keyがない環境では、adapterは `SKIP` を明示し、fixture版v1までを完了範囲にする。

## 現在通っている確認

| 確認 | コマンド | 期待結果 | 結果ファイル |
|---|---|---|---|
| 設計文書の実装前提 | `node .../check-model-drift-design-readiness.mjs .../design-readiness-check.config.json` | `PASS`, `failedCheckCount: 0` | `benchmark_threshold_design/experiments/model_drift_watch/schema_checks/2026-08-31.design-readiness-check.result.json` |
| smoke case schema | `node .../check-model-drift-cases.mjs .../case-schema-check.config.json` | `PASS`, `failedCheckCount: 0`, `caseCount: 5` | `benchmark_threshold_design/experiments/model_drift_watch/schema_checks/2026-08-31.smoke-case-schema-check.result.json` |
| grader fixture | `node .../run-model-drift-grader.mjs .../grader-fixture-ok.config.json` | `PASS`, `failedCaseCount: 0`, `contractPassRate: 1`, `sourceTraceRate: 1` | `benchmark_threshold_design/experiments/model_drift_watch/grader_results/2026-08-31.smoke.fixture.ok.grader-result.json` |
| observation schema | `node .../check-model-drift-observation.mjs .../observation-schema-check.config.json` | `PASS`, `failedCheckCount: 0`, `checkedMetricCount: 10` | `benchmark_threshold_design/experiments/model_drift_watch/schema_checks/2026-08-31.smoke-fixture-observation-schema-check.result.json` |
| status fixture OK | `node .../run-model-drift-check.mjs .../status-fixture-ok.config.json` | `OK`, `failedChecks: []` | `benchmark_threshold_design/experiments/model_drift_watch/status_fixtures/2026-08-31.status-ok.check-result.json` |
| status fixture WATCH | `node .../run-model-drift-check.mjs .../status-fixture-watch.config.json` | `WATCH`, `failedChecks: [model_drift.source_trace_rate_drop]` | `benchmark_threshold_design/experiments/model_drift_watch/status_fixtures/2026-08-31.status-watch.check-result.json` |
| status fixture ACTION | `node .../run-model-drift-check.mjs .../status-fixture-action.config.json` | `ACTION`, `failedChecks: [model_drift.contract_pass_rate_drop]` | `benchmark_threshold_design/experiments/model_drift_watch/status_fixtures/2026-08-31.status-action.check-result.json` |
| status fixture BLOCK | `node .../run-model-drift-check.mjs .../status-fixture-block.config.json` | `BLOCK`, `failedChecks: [model_drift.critical_unsupported_claims]` | `benchmark_threshold_design/experiments/model_drift_watch/status_fixtures/2026-08-31.status-block.check-result.json` |
| ACTION proposal | `node .../run-model-drift-proposal-generator.mjs .../proposal-action.config.json` | `PASS`, `proposalCount: 1`, `target: schema` | `benchmark_threshold_design/experiments/model_drift_watch/proposals/2026-08-31.status-action.proposal.json` |
| BLOCK proposal | `node .../run-model-drift-proposal-generator.mjs .../proposal-block.config.json` | `PASS`, `proposalCount: 1`, `target: prompt` | `benchmark_threshold_design/experiments/model_drift_watch/proposals/2026-08-31.status-block.proposal.json` |
| OpenAI adapter skip | `node .../run-openai-model-drift-adapter.mjs .../openai-adapter-skip.config.json` | `SKIP`, `caseCount: 5`, `skipReason: executionMode=skip` | `benchmark_threshold_design/experiments/model_drift_watch/raw_runs/2026-08-31.smoke.openai.skip.raw-run.json` |
| Claude adapter skip | `node .../run-claude-model-drift-adapter.mjs .../claude-adapter-skip.config.json` | `SKIP`, `caseCount: 5`, `skipReason: executionMode=skip` | `benchmark_threshold_design/experiments/model_drift_watch/raw_runs/2026-08-31.smoke.claude.skip.raw-run.json` |

これにより `V1-01`、`V1-02`、fixture範囲の `V1-05`、`V1-06`、`V1-07`、`V1-08`、fixture/skip範囲の `V1-09` は証跡付きで完了扱いにできる。

`V1-07` の完了判定:

| status | 判定metric | fixture上の値 | 期待status | 実status |
|---|---|---:|---|---|
| OK | 全threshold内 | failed checkなし | OK | OK |
| WATCH | `sourceTraceRateDrop` | 0.08 | WATCH | WATCH |
| ACTION | `contractPassRateDrop` | 0.2 | ACTION | ACTION |
| BLOCK | `criticalUnsupportedClaims` | 1 | BLOCK | BLOCK |

`V1-08` の完了判定:

| 入力status | failed check | proposal target | 実結果 |
|---|---|---|---|
| ACTION | `model_drift.contract_pass_rate_drop` | `schema` | `PASS`, `proposalCount: 1` |
| BLOCK | `model_drift.critical_unsupported_claims` | `prompt` | `PASS`, `proposalCount: 1` |

未完了:

| ID | 未完了理由 | 次に必要な証跡 |
|---|---|---|
| V1-03 | OpenAI adapterは実装済みでSKIP証跡あり。実API成功は未検証 | `executionMode: auto`、`OPENAI_API_KEY` ありでraw runを生成し、graderとobservation schema checkへ接続する |
| V1-04 | Claude adapterは実装済みでSKIP証跡あり。実API成功は未検証 | `executionMode: auto`、`ANTHROPIC_API_KEY` ありでraw runを生成し、graderとobservation schema checkへ接続する |
| V1-10 | READMEはfixture/skip手順まで更新済み。実API手順は未検証 | API keyありのlive実行手順と結果を追加する |
