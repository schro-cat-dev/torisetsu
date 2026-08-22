---
name: cognitive-model-calibration
description: "Use when user feedback shows a gap between AI default judgment and the user's cognitive model, especially around fact/observation/interpretation/inference ratios, priority viewpoint, recommendation score, task weight, lightweight/quick execution, thinking pattern checks, prompt/instruction calibration, strength/weakness hints, cognitive gap checks, action suggestions, relationship structure, alternative proposals, or explanation style."
---

# Cognitive Model Calibration

ユーザーのフィードバックから、AIの初期判断とユーザーの認知モデルのズレをケースとして保存し、次回以降に参照するための skill。

## 使うタイミング

- ユーザーが「その比率は違う」「おすすめ度はこっち」「この分け方は違う」と修正したとき。
- `事実 / 観察 / 解釈 / 推測` の比率や、関係の見方にズレが出たとき。
- 優先度の視点、おすすめ度、説明粒度、用語説明の出し方にフィードバックがあったとき。
- 考えすぎで実行が遅れる、またはすぐ動ける形への整理が必要だと分かったとき。
- 余計な推論で待たせている、またはタスクの重さの見積もりがズレたと分かったとき。
- 軽量にクイックに動けているかを確認し、必要なら手順を減らすとき。
- 即断即決から外れそうな流れで、短い提案に切り替える必要があるとき。
- ユーザーが嫌なこと、嫌いなこと、だめなことを明確に伝えたとき。
- ユーザーの得意そう、苦手そうなことを軽く確認した方が協働しやすいとき。
- 認知のズレや歪みがありそうで、具体例を出して確認した方がよいとき。
- ユーザー特性に合わせた「こう動きましょうか？」という提案が必要なとき。
- ユーザーの考え方にズレ、歪み、変な癖がありそうな原因を推測し、改善案と根拠を出すとき。
- ユーザーの依頼とAIの動きがズレ、次の指示文を一緒に改善した方がよいとき。
- 別案を出すときに、背景と根拠の出し方を確認したいとき。

## 作業手順

1. `references/case-index.md` を読む。
2. 考え方のズレや歪みの確認が関係する場合は、`references/thinking-pattern-check-cheatsheet.md` を読む。
3. 依頼の伝わり方が関係する場合は、`references/prompt-calibration-cheatsheet.md` を読む。
4. 関係しそうな方向性ディレクトリを見る。
5. 今の作業に直接関係するケースだけ確認する。
6. 新しいフィードバックがあれば、該当する `references/cases/<direction>/priority-<1-5>/` にケースファイルを追加する。
7. ケースファイルの先頭には、必ずユーザーのメッセージまたはフィードバックを書く。

## 保存ルール

- 方向性はサブディレクトリで分ける。例: `ratio-calibration`。
- 優先度はその下のディレクトリで分ける。例: `priority-5`。
- 数字は `5` が高く、`1` が低い。
- 優先度は、必ず視点とセットで書く。例: `視点: 初期環境構築 / 優先度: 5`。
- ファイル名は `YYYY-MM-DD-short-topic.md` にする。
- 迷う場合は、視点を添えて仮置きし、ユーザーの次の修正で調整する。
- 得意・苦手や認知のズレは断定しない。作業に関係する確認として、短く聞く。
- ユーザー自身の改善ルールは `internal_refs/user_improvement_rules/` に短く残す。会話全文は `internal_refs/chat_logs/` に寄せる。
- 認知のズレや歪みの推測は、`こうではないでしょうか？` の形で確認する。違う場合は修正材料として扱う。
- 軽量・クイックに進める場面では、深掘りより先に小さく動ける形へ寄せる。
- 依頼と動きがズレた場合は、責任探しではなく、次に伝わる依頼文へ直す作業として扱う。
- ズレの分解後は、ユーザー案とAI案の両方を出して擦り合わせる。
