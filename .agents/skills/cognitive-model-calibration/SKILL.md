---
name: cognitive-model-calibration
description: "Use when user feedback shows a gap between AI default judgment and the user's cognitive model, especially around fact/observation/interpretation/inference ratios, priority viewpoint, recommendation score, task weight, relationship structure, or explanation style."
---

# Cognitive Model Calibration

ユーザーのフィードバックから、AIの初期判断とユーザーの認知モデルのズレをケースとして保存し、次回以降に参照するための skill。

## 使うタイミング

- ユーザーが「その比率は違う」「おすすめ度はこっち」「この分け方は違う」と修正したとき。
- `事実 / 観察 / 解釈 / 推測` の比率や、関係の見方にズレが出たとき。
- 優先度の視点、おすすめ度、説明粒度、用語説明の出し方にフィードバックがあったとき。
- 考えすぎで実行が遅れる、またはすぐ動ける形への整理が必要だと分かったとき。
- 余計な推論で待たせている、またはタスクの重さの見積もりがズレたと分かったとき。
- 即断即決から外れそうな流れで、短い提案に切り替える必要があるとき。
- ユーザーが嫌なこと、嫌いなこと、だめなことを明確に伝えたとき。

## 作業手順

1. `references/case-index.md` を読む。
2. 関係しそうな方向性ディレクトリを見る。
3. 今の作業に直接関係するケースだけ確認する。
4. 新しいフィードバックがあれば、該当する `references/cases/<direction>/priority-<1-5>/` にケースファイルを追加する。
5. ケースファイルの先頭には、必ずユーザーのメッセージまたはフィードバックを書く。

## 保存ルール

- 方向性はサブディレクトリで分ける。例: `ratio-calibration`。
- 優先度はその下のディレクトリで分ける。例: `priority-5`。
- 数字は `5` が高く、`1` が低い。
- 優先度は、必ず視点とセットで書く。例: `視点: 初期環境構築 / 優先度: 5`。
- ファイル名は `YYYY-MM-DD-short-topic.md` にする。
- 迷う場合は、視点を添えて仮置きし、ユーザーの次の修正で調整する。
