# Task Format Index

タスクごとの型、出力、進め方フォーマットを登録する場所。

## 登録ルール

- ユーザーがフォーマットを指定したら、必要なものだけ登録する。
- 登録前に `スコープ`、`内容の種類`、`観点` を分ける。
- 別スコープ、別種類、別観点のものは同じ登録に混ぜない。
- 原則、1タスク種別につき1ファイルに分ける。
- まだ使わないフォーマットは増やさない。
- 登録時は、目的、入力、作業手順、出力、品質確認、禁止事項を短く書く。

## 現在の登録

- 動く成果物のローカル運用:
  - 参照: `.agents/skills/app-runtime-operations-governance/SKILL.md`
  - 用途: アプリ、API、DB、worker、queue、cache などをローカルで動かす時。
  - 必須: 1コマンド起動、同一スクリプトで終了、データを消さない cleanup、devログ、エラーログ。
- 品質ハーネス説明:
  - 参照: `.agents/skills/quality-harness-documentation-governance/SKILL.md`
  - 用途: 品質ハーネス、検証ゲート、check script、summary を作る時。
  - 必須: 観点、確認項目、判断根拠、実現方法、期待結果、実結果、残リスク、次の改善。
- AI追加作業の事前相談:
  - 参照: `.agents/skills/task-deadline-stakeholder-planning/SKILL.md`
  - 用途: ユーザーが明示していない検証、調査、サーバー起動、外部接続、長いコマンドを行う前。
  - 必須: することリスト、目的、ユーザー依頼との関係、優先度、想定時間、良いこと、やらない場合のリスク。
- 抽象助言・tipsの具体化:
  - 参照: `.agents/skills/task-output-format-governance/SKILL.md`
  - 用途: 設計、レビュー、プロンプト、運用、tips の助言を出す時。
  - 必須: 実データ例、JSON例、コマンド例、しきい値、NG例 / OK例、入力例 / 出力例のうち必要なものを添える。
