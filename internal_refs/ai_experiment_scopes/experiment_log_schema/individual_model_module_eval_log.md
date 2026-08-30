# Individual Model Module Eval Log

作成日: 2026-08-31

## 目的

特定モジュールに対して、複数モデルへ同じ設計・実装依頼を出し、成果物、所要時間、ユーザー指示コスト、修正コストを比較する。

## 保存先

`internal_refs/ai_experiment_scopes/prompt_behavior_experiments/experiments/model_module_eval/`

## ファイル名

```text
YYYY-MM-DD-<module>-<short-topic>.md
```

例:

```text
2026-08-31-todo-filter-module-design.md
```

## テンプレート

~~~markdown
# <module> model eval

## 検証ID

<YYYY-MM-DD.module.topic>

## 目的

<何を作らせて比較するか>

## 対象モジュール

- path:
- 役割:
- 変更してよい範囲:
- 変更しない範囲:

## 共通入力

```text
<各モデルへ渡す同一prompt>
```

## 共通チェックリスト

| ID | 項目 | 条件 |
|---|---|---|
| `contract` | 出力契約 | 指定形式を満たす |
| `scope` | scope順守 | 対象外へ広げない |
| `design` | 設計妥当性 | 責務、依存、データ流れが説明できる |
| `implementation` | 実装品質 | 最小差分で動く |
| `verification` | 検証 | 実行結果またはskip理由がある |
| `handoff` | 引き継ぎ | 次に見る場所が分かる |

## Run記録

| runId | model | 開始 | 終了 | 所要時間 | 入力tokens | 出力tokens | 指示回数 | AI確認回数 | 修正依頼回数 | 人間レビュー分 | 合格 |
|---|---|---|---|---:|---:|---:|---:|---:|---:|---:|---|
|  |  |  |  |  |  |  |  |  |  |  |  |

## モデル別結果

### <model>

- 成果物:
- 良かった点:
- 問題:
- ブレ:
- 追加指示:
- 修正コスト:
- 判定:

## 比較結果

| 観点 | 最も良いrun | 理由 |
|---|---|---|
| 品質 |  |  |
| 低コスト |  |  |
| 低修正 |  |  |
| 安定性 |  |  |

## 次回の改善

-
~~~

## 記録ルール

- まず小さく1モジュールで試す。
- 1回の検証で変える条件は少なくする。
- 断定せず、実測値で見る。
- モデルの印象ではなく、合格条件、時間、修正回数、レビュー分数で比べる。
