# ベンチマーク・閾値バージョン台帳

## v0.1.0

日付: 2026-08-25

目的:

- ベンチマークと閾値の管理場所を作る。
- 対象ごとに評価軸が違う前提を明示する。
- Phase 1の改善を、仕様差分、Harness検出、人間検出、修正依頼回数で見られるようにする。

含まれるもの:

- `README.md`
- `threshold_registry.md`
- `targets/README.md`
- `targets/phase_progress/README.md`
- `targets/todo_app_review/README.md`
- `targets/harness_quality/README.md`
- `targets/prompt_quality/README.md`
- `experiments/README.md`

状態:

- 初期設計。
- 閾値は仮。
- 実測データは未投入。

次にやること:

- TODOアプリレビューで初回実測を入れる。
- 実測後に閾値が厳しすぎるか、甘すぎるかを見直す。

## v0.2.0

日付: 2026-08-25

目的:

- ハーネス改善が実作業に効いたかを、改善前後の履歴で見られるようにする。
- `修正回数`、`所要時間`、`品質条件通過率`、`人間レビュー追加検出数` を分けて管理する。

含まれるもの:

- `targets/harness_effectiveness/README.md`
- `experiments/harness_effectiveness/README.md`
- `threshold_registry.md` の `harness_effectiveness.*`

状態:

- 初期設計。
- 閾値は仮。
- 実測履歴はまだテンプレート段階。

次にやること:

- TODOアプリレビューやハーネス改善で、実測履歴を1本ずつ追加する。
- 3本以上たまったら、暫定閾値が妥当か見直す。

## v0.3.0

日付: 2026-08-31

目的:

- GPT-5.5、GPT-5.6、Claude Opus 5、Claude Fable 5 などのモデル比較を、公開ベンチの印象ではなく、このリポジトリの実作業に近いcaseで評価できる入口を作る。
- 入出力ブレを一元的に扱うため、出力契約、根拠、再現性、費用、拒否/fallbackを分けて見る。

含まれるもの:

- `reports/2026-08-31-current-frontier-models-evaluation-protocol.md`
- `targets/model_eval_cases.md`
- `../experiment_log_schema/model_eval_result_schema.md`
- `threshold_registry.md` の `model_eval.*`

状態:

- 初期設計。
- 閾値は仮。
- 実測データは未投入。

次にやること:

- pilot 10 casesをJSONまたはMarkdownで実行可能な形へ落とす。
- 各モデル3回ずつ実行し、`model-eval-result.v1` で保存する。
- 3回以上の実測後、しきい値とcase配分を見直す。

## v0.3.1

日付: 2026-08-31

目的:

- トークン使用量を下げながら品質を維持する観点を、モデル評価に追加する。
- 高価モデルが本当に実務品質で優位か、安価モデルでもゴール、チェックリスト、schema、評価基準で同等出力を出せるかを検証対象にする。

含まれるもの:

- `targets/model_cost_quality_hypotheses.md`
- `targets/model_eval_cases.md` の `Cost Quality Cases`
- `threshold_registry.md` の token削減、品質維持、安価モデル同等率、scope drift、結論矛盾の指標
- `../ai_collaboration_cheatsheet/knowledge/2026-08-31-cost-quality-model-eval.md`

状態:

- 仮説追加。
- 実測データは未投入。

次にやること:

- `cost_quality.ablation.001` を最初の実行caseにする。
- 同一taskを4条件で回し、何が費用対品質に効いたかを見る。

## v0.3.2

日付: 2026-08-31

目的:

- モデル比較を、特定モジュール単位の小さな設計・実装検証として回せるようにする。
- 全体チャットログとは別に、個別検証ログで所要時間、指示回数、修正依頼回数、人間レビュー時間を残す。

含まれるもの:

- `.agents/skills/chat-log-discipline/SKILL.md` の個別検証ログ運用
- `../experiment_log_schema/individual_model_module_eval_log.md`
- `../prompt_behavior_experiments/experiments/model_module_eval/README.md`
- `targets/model_eval_cases.md` の `Module Design Cases`
- `.agents/skills/cognitive-model-calibration/references/cases/task-weight-calibration/priority-5/2026-08-31-small-validation-first.md`

状態:

- 個別ログ形式の初期設計。
- 実測データは未投入。

次にやること:

- 最初の対象モジュールを1つ選ぶ。
- 同一promptを複数モデルへ投げ、個別検証ログへrun単位で記録する。

## v0.3.3

日付: 2026-08-31

目的:

- 同じモデル名でも提供側の内部更新、routing、safeguard、実行環境差で性能や挙動が変わる可能性を、定期実行差分で検知できるようにする。
- 検知結果をモデル採用、prompt、出力契約、しきい値、作業ルールへ反映する流れを作る。

含まれるもの:

- `../evaluation_reproducibility/model_drift_watch/README.md`
- `../experiment_log_schema/model_drift_watch_observation_schema.md`
- `../experiment_log_schema/model_drift_check_result_schema.md`
- `experiments/model_drift_watch/README.md`
- `../runtime_context_assumptions/README.md` のモデルドリフト監視項目
- `threshold_registry.md` の `model_drift.*`

状態:

- 設計初版。
- 定期実行runnerは未実装。
- 実測データは未投入。

次にやること:

- smoke用case set 5件を決める。
- 初回baseline runを保存する。
- 2回目以降、差分を `OK/WATCH/ACTION/BLOCK` で判定する。

## v0.3.4

日付: 2026-08-31

目的:

- モデルドリフト監視を、baseline/currentの結果JSON比較runnerとして小さく動かせるようにする。

含まれるもの:

- `../evaluation_reproducibility/model_drift_watch/tools/run-model-drift-check.mjs`
- `../evaluation_reproducibility/model_drift_watch/configs/smoke-drift-check.config.json`
- `../evaluation_reproducibility/model_drift_watch/fixtures/baseline-result.json`
- `../evaluation_reproducibility/model_drift_watch/fixtures/current-result-ok.json`
- `../evaluation_reproducibility/model_drift_watch/feedback_loop.md`
- `../experiment_log_schema/model_drift_watch_observation_schema.md`
- `../experiment_log_schema/model_drift_check_result_schema.md`

状態:

- runner初版。
- モデルAPI呼び出しは未実装。
- 自動修正は未実装。まずproposal段階に止める。
- 入力は `model-drift-watch-observation.v1`、出力は `model-drift-check-result.v1` に分けた。

次にやること:

- smoke用case set 5件を実データ化する。
- provider別adapterを追加し、実行観測値を `model-drift-watch-observation.v1` で保存する。
- ACTION/BLOCK時のproposal schemaを追加する。
