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
