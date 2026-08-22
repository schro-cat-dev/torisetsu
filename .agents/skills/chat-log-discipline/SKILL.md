---
name: chat-log-discipline
description: "Use when working in this repository, responding to user requests, or updating repository instructions: always record each user message and the AI response/work summary in internal_refs/chat_logs."
---

# Chat Log Discipline

この skill は、このリポジトリで作業する AI エージェントが必ず守る会話ログ運用を定義する。

## 必須ルール

1. ユーザーから依頼、修正、追加ルール、確認依頼を受けたら、`internal_refs/chat_logs/YYYY-MM-DD.md` に記録する。
2. `YYYY-MM-DD` は作業時点のローカル日付を使う。
3. 既存ログがある場合は上書きせず、末尾へ追記する。
4. 1つのユーザーメッセージにつき、次の2項目を1セットで残す。
   - `ユーザーメッセージ`: ユーザーが何を聞いたか、何を依頼したか、何をルール化したか。
   - `AIの回答・作業要約`: AIがどう回答したか、何を調べたか、どのファイルを読んだか、何を編集したか、どの検証をしたかを約400字で要約する。
5. ユーザーのメッセージが複数ある場合は、メッセージ単位で分けて時系列に並べる。
6. ユーザーが「必ず守る」「今後も」「ルールとして」などを明示した指示は、ログだけでなく `AGENTS.md` または該当 skill にも反映する。
7. 最終回答の前に、当該ターンのログ追記が完了していることを確認する。

## 推奨フォーマット

```markdown
## N. ユーザーメッセージ

<ユーザーの依頼内容の要約>

### AIの回答・作業要約

<約400字の要約>
```

## 注意点

- ログは会話の監査証跡であり、単なる作業メモではない。
- ユーザーの意図、AIの判断、実際に触ったファイル、未完了事項が後から追えるように書く。
- 機密情報、トークン、秘密鍵、不要な個人情報は記録しない。
