# 実行完了優先loop

作成日: 2026-08-31

## 目的

AIの実行時に、可能性の探索を実行フェーズへ持ち込まず、決まった作業をマイルストーンとチェックリストで消化し、品質チェック付きで最速に終わらせる。

ここでの `完了` は、作業を途中で切り上げることではない。今回の完了条件を満たし、確認結果を出し、次の改善へ接続できる状態を指す。

## 基本ルール

- 実行フェーズに入ったら、追加探索を止め、決めたマイルストーンとチェックリストを上から消化する。
- チェックが埋まらない場合は、原因を短く分類し、埋めるための作業を実行してから正当にチェックを付ける。
- 失敗しても戻せる作業は、必要な確認をしたうえで止まらず実行する。失敗したら結果を記録し、すぐ修正loopへ入る。
- まず終わらせる。ただし品質チェックは落とさない。
- 終わったら、完了度と品質をscore化する。
- scoreが低い項目は、次loopの改善対象にする。

## 実行loop

| 段階 | やること | 完了条件 |
|---|---|---|
| Plan | 今回の完了条件、制約、見積もり、消化するチェックリストを決める | 1文で完了条件が書ける |
| Do | チェックリストを上から消化し、埋まらない項目は原因分析と実行で埋める | 成果物または実行結果がある |
| Check | 品質チェック、構文確認、差分確認をする | 実結果が記録されている |
| Score | 完了、品質、速度、証跡、修正コストを採点する | `execution-completion-score-result.v1` が出る |
| Act | scoreが低い項目を次loopへ回す | 次の1手が1つ決まる |

## 探索を止める条件

| 条件 | 動き |
|---|---|
| ユーザーが実装・作成を求めている | 先に作る |
| 方針が1つに絞れる | その方針で進め、チェックリストを消化する |
| 迷いが品質に直結しない | 後回しにする |
| 追加調査が30分を超えそう | 目的、見積もり、判断点を出して相談する |
| 未実装が残る | 未実装理由、残作業、見積もりを必ず書く |

## 失敗の扱い

| 状況 | 動き |
|---|---|
| 戻せる変更、fixture作成、docs修正、schema調整 | 実行して結果を見る |
| コマンド失敗 | stdout/stderrを見て原因を分類し、修正して再実行する |
| 同じ失敗が2回続く | 試したこと、原因候補、次の選択肢を出して止まる |
| 破壊的操作、外部課金、権限操作 | 実行前に確認する |

## scoreの考え方

scoreはAIを褒めるためではなく、次回の実行を速くし、品質を落とさないために使う。

| 項目 | 見るもの |
|---|---|
| completion | 今回の完了条件を満たしたか |
| quality | 必須チェックが通ったか |
| speed | 見積もりから大きく外れていないか |
| focus | 勝手にスコープを広げていないか |
| evidence | 実行結果や確認結果があるか |
| revision cost | ユーザー修正ややり直しが少ないか |
| next loop | 次の改善が1つに絞れているか |

## 初版runner

実行:

```bash
node internal_refs/ai_experiment_scopes/execution_completion_loop/tools/run-completion-score.mjs internal_refs/ai_experiment_scopes/execution_completion_loop/configs/default-completion-score.config.json internal_refs/ai_experiment_scopes/execution_completion_loop/fixtures/sample-completion-record.json
```

出力:

- `internal_refs/ai_experiment_scopes/execution_completion_loop/results/sample-completion-score.result.json`

## 非ゴール

- 作業を雑に早く終わらせる。
- scoreを高く見せるために未完了を隠す。
- 低scoreを責める材料にする。
- 自動で大きなpatchや方針変更を入れる。
