# 閾値レジストリ

このファイルは、現在使う評価指標と閾値の入口です。

## ルール

- 閾値は対象ごとに分ける。
- `>=`、`<=` などの条件を曖昧にしない。
- 数値は固定の真理ではなく、実測で更新する。
- 更新したら `version_ledger.md` に理由を残す。

## 現在の初期案

| ID | 対象 | 指標 | 条件 | 初期値 | 単位 | 状態 |
|---|---|---|---|---:|---|---|
| `phase1.spec_diff_reduction` | Phase 1進捗 | 仕様差分の減少率 | `>=` | 50 | % | 仮 |
| `phase1.human_only_reduction` | Phase 1進捗 | 人間だけが見つけるズレの減少率 | `>=` | 70 | % | 仮 |
| `phase1.revision_request_reduction` | Phase 1進捗 | 修正依頼回数の減少率 | `>=` | 50 | % | 仮 |
| `phase1.harness_detection_ratio` | Phase 1進捗 | Harness検出数 / 仕様差分数 | `>=` | 70 | % | 仮 |
| `harness_effectiveness.revision_request_reduction` | ハーネス改善効果 | 修正依頼回数の減少率 | `>=` | 60 | % | 仮 |
| `harness_effectiveness.elapsed_time_reduction` | ハーネス改善効果 | 所要時間の減少率 | `>=` | 50 | % | 仮 |
| `harness_effectiveness.quality_pass_rate` | ハーネス改善効果 | 品質条件通過率 | `==` | 100 | % | 仮 |
| `harness_effectiveness.confirmed_history_count` | ハーネス改善効果 | 改善前後を比較できる履歴数 | `>=` | 3 | 本 | 仮 |
| `model_eval.contract_pass_rate` | モデル比較pilot | 出力契約通過率 | `==` | 100 | % | 仮 |
| `model_eval.critical_unsupported_claims` | モデル比較pilot | 重要claimの根拠なし件数 | `==` | 0 | 件 | 仮 |
| `model_eval.source_trace_rate` | モデル比較pilot | claimからsourceへ辿れる率 | `>=` | 95 | % | 仮 |
| `model_eval.task_pass_rate` | モデル比較pilot | task rubric合格率 | `>=` | 80 | % | 仮 |
| `model_eval.repeat_pass_count` | モデル比較pilot | 同一case 3回実行で合格した回数 | `>=` | 3 | 回/3回 | 仮 |
| `model_eval.human_revision_minutes` | モデル比較pilot | 人間修正時間 | `<=` | baselineの70 | % | 仮 |
| `model_eval.cost_per_passed_case` | モデル比較pilot | 合格caseあたり費用 | `<=` | baselineの120 | % | 仮 |
| `model_eval.false_refusal_or_fallback_rate` | モデル比較pilot | 正当タスクで拒否またはfallbackした率 | `<=` | 5 | % | 仮 |
| `model_eval.token_reduction_rate` | モデル比較pilot | baseline比の出力+reasoning token削減率 | `>=` | 50 | % | 仮 |
| `model_eval.quality_retention_rate` | モデル比較pilot | 高価モデルbaselineに対する品質維持率 | `>=` | 90 | % | 仮 |
| `model_eval.cheap_model_parity_rate` | モデル比較pilot | 安価モデルが高価モデル同等と判定されたcase率 | `>=` | 70 | % | 仮 |
| `model_eval.scope_drift_count` | モデル比較pilot | 依頼範囲外へ勝手に広げた件数 | `==` | 0 | 件 | 仮 |
| `model_eval.conclusion_conflict_count` | モデル比較pilot | 同一case 3回実行で結論が矛盾した件数 | `==` | 0 | 件 | 仮 |
| `model_drift.contract_pass_rate_drop` | モデルドリフト監視 | baseline比の出力契約通過率低下 | `<=` | 0 | pt | 仮 |
| `model_drift.source_trace_rate_drop` | モデルドリフト監視 | baseline比のsource trace率低下 | `<=` | 5 | pt | 仮 |
| `model_drift.task_score_drop` | モデルドリフト監視 | baseline比のtask rubric平均低下 | `<=` | 5 | pt | 仮 |
| `model_drift.token_increase_rate` | モデルドリフト監視 | baseline比のtoken増加率 | `<=` | 20 | % | 仮 |
| `model_drift.latency_increase_rate` | モデルドリフト監視 | baseline比のlatency増加率 | `<=` | 30 | % | 仮 |
| `model_drift.false_refusal_or_fallback_rate` | モデルドリフト監視 | 正当タスクで拒否またはfallbackした率 | `<=` | 5 | % | 仮 |
| `model_drift.human_revision_minutes_increase_rate` | モデルドリフト監視 | baseline比の人間修正時間増加率 | `<=` | 20 | % | 仮 |

## 注意

上の値は、Phase 1の例をもとにした初期案です。実測が3回以上たまるまでは、合格ラインではなく観察目安として扱う。

`model_eval.*` も同じく初期案です。モデル採用の本判定ではなく、pilot 10 casesを回すための観察目安として扱う。

`model_drift.*` は同一caseの定期実行差分を見るための初期案です。内部更新を直接証明するものではなく、挙動変化の検知目安として扱う。
