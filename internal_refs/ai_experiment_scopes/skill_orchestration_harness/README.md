# Skill Orchestration Harness Draft

## 目的

AIが使う skill の順番、作業ステップ、処理時ステートを、ハーネス側で管理するための実験ドラフト。

## 背景

Codex や Claude などの内蔵 planning は便利だが、粒度が粗いと次の問題が起きる。

- ノイズが増える。
- ユーザー意図が歪む。
- 不要な skill や文脈を読みすぎる。
- 相談、設計、実装、検証、push が混ざる。
- 途中でスコープがずれても、そのまま進むことがある。

そのため、提供元の内蔵 planning とは別に、リポジトリ側のハーネス層で作業ステップとステートを管理する。

## このドラフトで扱うこと

- AIが動く順番。
- 各ステップで読む skill。
- 各ステップで読まない skill。
- 次のステートへ進む条件。
- ステップ内でさらに小さく分ける条件。
- 余計な連携で性能が悪化しないための禁止事項。

## ファイル

| ファイル | 役割 |
|---|---|
| `SKILL_DRAFT.md` | 将来skill化するためのドラフト。まだactive skillではない |
| `samples/todo-design-orchestration.md` | TODO設計タスクでのステート、skill順序、出力例 |

## 現時点の扱い

- まだ `.agents/skills` には置かない。
- まだ Codex / Claude の内蔵 planning とは直接連携しない。
- まずは文書ドラフトとして読み、手動で試す。
- 実際に効くかを見てから、skill化、script化、tool化を考える。
