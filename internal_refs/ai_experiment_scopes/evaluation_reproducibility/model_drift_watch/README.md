# モデルドリフト定期監視

作成日: 2026-08-31

## 目的

同じモデル名を使っていても、提供側の内部更新、routing、safeguard、推論設定、実行環境の変化で、性能や挙動が変わる可能性がある。これを定期的に検知し、プロンプト、モデル選定、しきい値、作業方針へ反映する。

ここでの `モデルドリフト` は、同じ入力と同じ条件で実行した時に、以前と比べて出力品質、構造、根拠、コスト、時間、拒否/fallback、修正コストが変わることを指す。

## 概要

これは、OpenAI/ClaudeなどのLLMをこのリポジトリの実作業で使い続けてよいかを定期確認する仕組みです。

同じcaseを同じ条件で投げ、前回baselineと比べて、形式、根拠、実務品質、token、latency、拒否/fallback、人間修正時間が悪化していないかを見る。

## 誰が何を判断するために使うか

| 読む人 | 判断したいこと | この仕組みが返すもの |
|---|---|---|
| ユーザー | 高価モデルを使う価値があるか | cost、quality、revision timeの比較 |
| AIエージェント | どのモデル/設定で作業するか | routing候補、prompt/schema改善案 |
| 実装担当 | 何を直せば次回安定するか | failed checks、proposal JSON |
| レビュー担当 | 判断が根拠付きか | raw output、observation、check result |

## 初期対象モデル

| provider | model | 用途 | この監視で見る主な点 |
|---|---|---|---|
| OpenAI | `gpt-5.6-sol` | 高性能baseline | 難しい設計・実装で品質差が出るか |
| OpenAI | `gpt-5.6-terra` | 中間cost候補 | Solからどこまでcostを落とせるか |
| OpenAI | `gpt-5.6-luna` | 安価候補 | 契約を固定すれば実務に使えるか |
| OpenAI | `gpt-5.5` | 比較候補 | 利用可能なら旧/別世代baselineにする |
| Anthropic | `claude-opus-5` | Claude高性能baseline | 長文指示、agentic coding、設計で安定するか |
| Anthropic | `claude-fable-5` | Claude高cost候補 | 高costに見合う改善があるか、拒否/fallbackが増えないか |

注意: `gpt-5.5` は、実行時にAPIで利用可能性を確認する。使えない場合は失敗扱いではなく `SKIP:model_unavailable` として記録する。

## この仕組みがOKになる状態

| ID | OK条件 | 具体例 |
|---|---|---|
| O-01 | 対象モデルが明示されている | `provider`, `model`, `settings` がrun configにある |
| O-02 | 同じ入力で再実行できる | `cases/smoke.v1.json` に固定promptが5件ある |
| O-03 | 出力契約を機械判定できる | required fields、extra fields、Markdown混入を落とせる |
| O-04 | 1回分の実行結果を保存できる | `model-drift-watch-observation.v1` が出る |
| O-05 | baselineとの差分を保存できる | `model-drift-check-result.v1` が出る |
| O-06 | 運用判断が出る | `OK/WATCH/ACTION/BLOCK` のどれか |
| O-07 | 悪化時に直す場所が出る | `prompt/schema/routing/threshold` のproposal |
| O-08 | 証跡が後から追える | raw output、observation、check result、proposalが保存される |

## 基本方針

- 大きく断定せず、小さく定期実行する。
- 同じcase、同じprompt、同じ出力契約を使う。
- モデル名だけで同一性を判断しない。
- 変化を見つけたら、すぐ本番方針を変えず、影響範囲を分ける。
- 結果は個別検証ログとして残し、しきい値や採用モデルへ反映する。

## コア設計

この仕組みの芯は `core_design.md` に置く。adapterやモデル名ではなく、固定case、出力契約、grader、observation、drift check、proposal、ledgerを守る。

## 固定するもの

| 項目 | 固定内容 |
|---|---|
| case set | smoke 5件、weekly 10件、monthly 30件 |
| prompt | caseごとの入力prompt |
| output contract | `model-eval-result.v1` または個別schema |
| grader | 同じ機械判定 + 必要な人間レビュー |
| model settings | temperature、reasoning/thinking effort、tool権限 |
| environment | repo commit、sandbox、network、tool availability |

## 観測するもの

| 指標 | 見る理由 |
|---|---|
| contract pass rate | 出力形式が壊れていないか |
| source trace rate | 根拠付き出力が崩れていないか |
| unsupported claims | 補完ノイズが増えていないか |
| task rubric score | 実務品質が落ちていないか |
| conclusion conflict count | 同一caseで結論が揺れていないか |
| token count | コストが増えていないか |
| latency | 運用上使える速度か |
| refusal/fallback rate | safety変更で正当作業が止まらないか |
| human revision minutes | ユーザー側の修正コストが増えていないか |

## 実行頻度

| 種類 | 頻度 | case数 | 目的 |
|---|---:|---:|---|
| smoke | 週1回 | 5 | 大きな劣化を早く拾う |
| weekly | 週1回 | 10 | 主要タスクの安定性を見る |
| monthly | 月1回 | 30 | 採用モデルとしきい値を見直す |
| incident | 異常時 | 必要分 | 出力崩れや拒否増加の原因を見る |

## 判定

| 判定 | 条件 | 次の動き |
|---|---|---|
| OK | 全critical指標がしきい値内 | 継続 |
| WATCH | 軽微な悪化、または1回だけの異常 | 翌回も同caseを実行 |
| ACTION | 2回連続の悪化、またはcritical違反 | prompt、model routing、しきい値を見直す |
| BLOCK | 重要claim根拠なし、契約崩れ、拒否/fallback急増 | 対象用途で一時採用停止 |

## OK/NG例

OK:

- `gpt-5.6-luna` がsmoke 5件でcontract pass 100%、critical unsupported claims 0、latencyとtokenも許容内なので、軽いschema変換系へrouting候補にする。
- `claude-fable-5` がtask scoreを10pt上げたがcostが2倍以上なので、難caseだけ用途限定にする。
- `gpt-5.6-sol` が2回連続でsource trace rateを落としたので、promptにsource ID必須条件を追加するproposalを出す。

NG:

- `高性能モデルなので採用` と書くだけ。
- `前より良さそう` と文章で判断し、observation JSONを残さない。
- モデル名だけ変えて、case、prompt、settings、graderを変えてしまう。
- `ACTION` が出ても、prompt/schema/routing/thresholdのどこを直すか出さない。

## PDCA

| 段階 | 内容 |
|---|---|
| Plan | 固定case、モデル、設定、しきい値を決める |
| Do | 定期実行し、個別検証ログへ保存する |
| Check | 前回baselineとの差分を見る |
| Act | モデル採用、prompt、schema、しきい値、作業ルールへ反映する |

## 保存先

| 種類 | path |
|---|---|
| 設計 | `internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/` |
| 実行結果 | `internal_refs/ai_experiment_scopes/benchmark_threshold_design/experiments/model_drift_watch/` |
| 実行条件 | `internal_refs/ai_experiment_scopes/runtime_context_assumptions/experiments/` |
| しきい値 | `internal_refs/ai_experiment_scopes/benchmark_threshold_design/threshold_registry.md` |
| 変更履歴 | `internal_refs/ai_experiment_scopes/benchmark_threshold_design/version_ledger.md` |

## 初版ツール

設計文書の実装前提check:

```bash
node internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/tools/check-model-drift-design-readiness.mjs internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/configs/design-readiness-check.config.json
```

期待結果:

- `status: "PASS"`
- `failedCheckCount: 0`

結果ファイル:

- `internal_refs/ai_experiment_scopes/benchmark_threshold_design/experiments/model_drift_watch/schema_checks/2026-08-31.design-readiness-check.result.json`

失敗時に見る場所:

- `failedChecks[].file`
- `failedChecks[].missingText`

smoke case schema check:

```bash
node internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/tools/check-model-drift-cases.mjs internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/configs/case-schema-check.config.json
```

期待結果:

- `status: "PASS"`
- `failedCheckCount: 0`
- `summary.caseCount: 5`

結果ファイル:

- `internal_refs/ai_experiment_scopes/benchmark_threshold_design/experiments/model_drift_watch/schema_checks/2026-08-31.smoke-case-schema-check.result.json`

失敗時に見る場所:

- `failedChecks[].path`
- `failedChecks[].message`

raw output fixtureをgraderで採点する:

```bash
node internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/tools/run-model-drift-grader.mjs internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/configs/grader-fixture-ok.config.json
```

このrunnerは、AIモデルを直接呼び出さない。`model-drift-raw-run.v1` のraw outputを読み、case setの `expectedContract` と `grading` に通して、`model-drift-watch-observation.v1` とgrader resultを出す。

期待結果:

- `status: "PASS"`
- `failedCaseCount: 0`
- `metrics.contractPassRate: 1`
- `metrics.sourceTraceRate: 1`

結果ファイル:

- `internal_refs/ai_experiment_scopes/benchmark_threshold_design/experiments/model_drift_watch/observations/2026-08-31.smoke.fixture.ok.observation.json`
- `internal_refs/ai_experiment_scopes/benchmark_threshold_design/experiments/model_drift_watch/grader_results/2026-08-31.smoke.fixture.ok.grader-result.json`

失敗時に見る場所:

- `caseResults[].violations[].path`
- `caseResults[].violations[].message`

observation schema check:

```bash
node internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/tools/check-model-drift-observation.mjs internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/configs/observation-schema-check.config.json
```

期待結果:

- `status: "PASS"`
- `failedCheckCount: 0`
- `summary.checkedMetricCount: 10`

結果ファイル:

- `internal_refs/ai_experiment_scopes/benchmark_threshold_design/experiments/model_drift_watch/schema_checks/2026-08-31.smoke-fixture-observation-schema-check.result.json`

失敗時に見る場所:

- `failedChecks[].path`
- `failedChecks[].message`

baseline結果と今回結果を比較するrunner:

```bash
node internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/tools/run-model-drift-check.mjs internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/configs/smoke-drift-check.config.json
```

このrunnerは、AIモデルを直接呼び出さない。`model-drift-watch-observation.v1` のJSONを2つ読み、しきい値を見て `model-drift-check-result.v1` として `OK/WATCH/ACTION/BLOCK` と次アクションを出す。

4 status fixture:

```bash
node internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/tools/run-model-drift-check.mjs internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/configs/status-fixture-ok.config.json
node internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/tools/run-model-drift-check.mjs internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/configs/status-fixture-watch.config.json
node internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/tools/run-model-drift-check.mjs internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/configs/status-fixture-action.config.json
node internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/tools/run-model-drift-check.mjs internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/configs/status-fixture-block.config.json
```

期待結果:

| config | 期待status | 主なfailed check |
|---|---|---|
| `status-fixture-ok.config.json` | `OK` | なし |
| `status-fixture-watch.config.json` | `WATCH` | `model_drift.source_trace_rate_drop` |
| `status-fixture-action.config.json` | `ACTION` | `model_drift.contract_pass_rate_drop` |
| `status-fixture-block.config.json` | `BLOCK` | `model_drift.critical_unsupported_claims` |

結果ファイル:

- `internal_refs/ai_experiment_scopes/benchmark_threshold_design/experiments/model_drift_watch/status_fixtures/2026-08-31.status-ok.check-result.json`
- `internal_refs/ai_experiment_scopes/benchmark_threshold_design/experiments/model_drift_watch/status_fixtures/2026-08-31.status-watch.check-result.json`
- `internal_refs/ai_experiment_scopes/benchmark_threshold_design/experiments/model_drift_watch/status_fixtures/2026-08-31.status-action.check-result.json`
- `internal_refs/ai_experiment_scopes/benchmark_threshold_design/experiments/model_drift_watch/status_fixtures/2026-08-31.status-block.check-result.json`

ACTION/BLOCK proposal generator:

```bash
node internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/tools/run-model-drift-proposal-generator.mjs internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/configs/proposal-action.config.json
node internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/tools/run-model-drift-proposal-generator.mjs internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/configs/proposal-block.config.json
```

期待結果:

| config | 入力status | proposal target |
|---|---|---|
| `proposal-action.config.json` | `ACTION` | `schema` |
| `proposal-block.config.json` | `BLOCK` | `prompt` |

結果ファイル:

- `internal_refs/ai_experiment_scopes/benchmark_threshold_design/experiments/model_drift_watch/proposals/2026-08-31.status-action.proposal.json`
- `internal_refs/ai_experiment_scopes/benchmark_threshold_design/experiments/model_drift_watch/proposals/2026-08-31.status-block.proposal.json`

OpenAI/Claude adapterのSKIP確認:

```bash
node internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/tools/run-openai-model-drift-adapter.mjs internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/configs/openai-adapter-skip.config.json
node internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/tools/run-claude-model-drift-adapter.mjs internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/configs/claude-adapter-skip.config.json
```

期待結果:

- OpenAI: `status: "SKIP"`, `caseCount: 5`, `skipReason: "executionMode=skip"`
- Claude: `status: "SKIP"`, `caseCount: 5`, `skipReason: "executionMode=skip"`

結果ファイル:

- `internal_refs/ai_experiment_scopes/benchmark_threshold_design/experiments/model_drift_watch/raw_runs/2026-08-31.smoke.openai.skip.raw-run.json`
- `internal_refs/ai_experiment_scopes/benchmark_threshold_design/experiments/model_drift_watch/raw_runs/2026-08-31.smoke.claude.skip.raw-run.json`

注意:

- `executionMode` を `auto` にし、API keyがある場合だけ外部APIを呼ぶ。
- 実API成功、live raw runのgrader接続、live observation生成は未検証。

反映loopは `feedback_loop.md` に置く。

コードレビュー用の汎用性評価と内部処理分析:

- `internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/code_review_report.md`

## 非ゴール

- 提供会社の内部更新内容を断定する。
- 1回の異常だけでモデルを切り替える。
- 公開ベンチの順位だけで実務採用を変える。
- runner本体に対象case、path、しきい値を直書きする。
