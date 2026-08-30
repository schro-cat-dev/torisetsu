---
name: completion-driven-execution
description: "Use when a task risks endless exploration, unclear completion, missing estimates, roadmap-only output, or when the user asks to finish fast while preserving checklist quality and scoring each completed work unit."
---

# Completion Driven Execution

このskillは、AIが多様な可能性の探索を実行フェーズへ持ち込まず、決まった作業をマイルストーンとチェックリストで消化し、品質証跡付きで完了させるために使う。

## 基本方針

- 実行フェーズに入ったら、追加探索を止め、決めたマイルストーンとチェックリストを上から消化する。
- チェックが埋まらない場合は、原因を短く分類し、埋めるための作業を実行してから正当にチェックを付ける。
- 失敗しても戻せる作業は、必要な確認をしたうえで止まらず実行する。失敗したら結果を記録し、すぐ修正loopへ入る。
- 品質チェックは省略しない。品質チェックを通せないものは完了扱いにしない。
- 依存順序を飛ばさない。前工程が後工程の入力になる場合、前工程が未実装・未検証のまま後工程へ進まない。
- 未実装の前工程を理由に、後工程の責務を弱めたり、SKIPだけで完了に見せたりしない。
- 依存順序は厳守ルールとして扱う。後工程を先に作った場合でも、前工程の成果物、検証コマンド、結果ファイルが揃うまで完了扱いにしない。
- 終わったらscoreを付け、低い項目を次loopへ回す。
- roadmapだけで終えない。

## 実行契約

- docs、fixture、schema draft、local runner、構文チェック、単体テストなど、git差分で戻せて外部被害がない作業は止まらず実行する。
- 失敗は避ける対象ではなく、原因を見つけるための実行結果として扱う。
- 失敗したら、原因分類、修正、再実行、証跡記録まで行う。
- 広範囲変更、戻しにくい変更、生成物の大量上書き、migration、外部API実行、push、deploy、本番データ、secret操作は事前確認する。
- クリティカルなローカル変更では、開始前にバックアップブランチまたは退避方針を短く提示する。許可がある場合だけ作成する。

## 作業前に決めること

- 今回の完了条件。
- 消化するマイルストーン。
- 埋めるチェックリスト。
- やらないこと。
- 見積もり。
- 途中で止まる条件。
- 最後に実行する確認。

## 実行中の動き

- チェックリストを見ながら、完了した項目を順に埋める。
- 埋められない項目が出たら、`原因`、`必要な作業`、`今すぐ実行するか` を短く判断する。
- 次の項目へ進む前に、その項目の入力になる成果物が存在し、検証済みか確認する。
- 入力が未実装の場合は、後工程へ逃げず、入力になる成果物を先に作る。
- 具体ケースとして、モデルドリフト監視では `raw output fixture -> grader -> observation schema check -> 比較runner -> proposal -> adapter` を守る。
- 修正前のNG: `graderが未実装なので、adapterはraw run logとSKIPだけ出す` としてadapterを先に作る。
- NG理由: adapterからobservationへ接続できるか検証できず、完了条件IDだけ進んだように見える。
- 修正後のOK: raw output fixtureを作り、graderでobservationを生成し、observation schema checkを通してからadapterへ進む。
- 進行してよい条件: `rawRunFile`、`graderResultFile`、`observationFile`、observation schema check結果が揃っている。
- 進行してはいけない条件: `adapterはSKIPを明示する` だけで、graderとobservation schema checkが未実装または未実行。
- 失敗しても大丈夫な作業は、失敗を避けるための長い検討に入らず実行する。
- 失敗した場合は、失敗内容、原因、修正、再確認結果を残す。
- 危険な操作、権限が必要な操作、ユーザー判断が必要な操作だけ止まる。

## 最終報告で必ず出すこと

- 今回の完了条件を満たしたか。
- 作ったもの、動かしたもの、確認結果。
- 未完了がある場合は、理由、残作業、見積もり、必要入力。
- 進捗率を出す場合は、完了条件ID、分母、分子、重み、除外項目を同時に出す。
- 目算の割合を使わない。未検証の成果物は `作成済み・未検証` と書き、完了扱いにしない。
- completion scoreを付ける場合は、score、低かった項目、次の1手。

## 禁止

- `次にやること` だけで終わる。
- 未実装を完了扱いにする。
- 可能性の列挙で、決まっている作業の実行を遅らせる。
- 作業単位を小さくすることを理由に、本来必要なチェックや完了条件を避ける。
- 前工程が未実装なのに、後工程を作って進捗を出したように見せる。
- scoreを高く見せるために不足を隠す。

## 参照

実行loopとscore runner:

- `internal_refs/ai_experiment_scopes/execution_completion_loop/README.md`

失敗許容範囲とバックアップ境界:

- `internal_refs/ai_experiment_scopes/execution_completion_loop/failure_boundary.md`

モデルドリフト監視のような具体タスクでは、対象ディレクトリの `*_completion_contract.md` を先に読む。
