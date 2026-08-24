---
name: task-output-format-governance
description: "Use when starting, executing, reviewing, or documenting a task where the user has provided or may later provide a task-specific format, output schema, checklist, workflow template, required structure, quality gate, or delivery style that Codex must follow."
---

# Task Output Format Governance

この skill は、タスクごとの型、出力、進め方フォーマットを守るために使う。

## 1. 必須ルール

- タスク開始時に、該当するフォーマットがあるか確認する。
- ルールやドキュメントを追加する前に、`スコープ`、`内容の種類`、`観点` で分ける。
- フォーマットがある場合は、それを最優先で守る。
- フォーマットが未登録でも、ユーザーが会話で指定した型はそのタスク内で守る。
- ユーザーが新しいフォーマットを追加したら、`references/format-index.md` に登録する。
- 出力前に、指定フォーマットから外れていないか確認する。

## 2. 分け方

| 分類軸 | 意味 | 例 |
|---|---|---|
| スコープ | どこまでが対象か | runtime運用、品質ハーネス説明、UI設計、会話ログ |
| 内容の種類 | 何の話か | 起動終了、ロガー、テスト、ドキュメント、フォーマット |
| 観点 | 何を見て判断するか | デバッグしやすさ、保守性、引き継ぎやすさ、価値 |

判断ルール:
- 3つの分類軸のどれかが違うなら、同じskillや同じ節に混ぜない。
- 迷ったら、先に小さく分ける。
- 共通ルールは `AGENTS.md`、分類手順はこのskill、個別ルールは該当skillに置く。

## 3. 確認する場所

1. 今のユーザーメッセージ。
2. 直近の会話内の指定。
3. `references/format-index.md`。
4. 対象タスクの関連ドキュメント。

## 4. フォーマットがある場合の進め方

- `目的`: 何のための型か。
- `入力`: 何を受け取るか。
- `作業手順`: どう進めるか。
- `出力`: どの形で返すか。
- `品質確認`: 何を満たせばOKか。
- `禁止`: 何をしないか。

## 5. フォーマットがない場合

- 勝手に重い型を作らない。
- まずは最小の形で進める。
- 必要なら、次のように短く聞く。

```text
このタスク用の出力フォーマットはありますか？
なければ、最小構成で進めます。
```

## 6. ノイズ削減

- フォーマットは、作業に必要な要素だけにする。
- 使わない項目、過剰な背景、不要な将来案は入れない。
- 迷ったら、今のタスクで使うかどうかで判断する。
