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
- ユーザーが示した基準値、言い回し、品質条件、判断軸を、AIが勝手に弱めない。
- 読者水準や引き継ぎ条件を上げる文は、ノイズ削減の対象にしない。
- 削るか迷う文は、削除前に `残す価値`、`削るリスク`、`代替文` を確認する。

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
- 見出しや説明に、情報を増やさない修飾語を使わない。
- NG: 時間訴求の見出し、曖昧な程度語、過剰な称賛語、完成度を誇張する語。
- OK: `概要`、`目的`、`対象`、`入力`、`出力`、`完了条件`、`判断条件`、`残リスク`。
- reader-firstを意識する場合も、キャッチコピー風の見出しではなく、読者が判断できる項目名にする。
- ただし、非担当者への引き継ぎに必要な説明まで削らない。
- 引き継ぎ用の説明は、初見の非担当者が対象、目的、実行可否、手順、失敗時の確認先を判断できる粒度にする。

## 7. 用語と具体例

- `spec`、`manifest`、`adapter`、`contract` のように似た用語や抽象語を使う場合は、初出時に何を指すかを短く説明する。
- 説明には、必ず具体例を1つ添える。
- 例: `テストspec` は、テスト実行moduleへ渡すJSONの指示書。具体例: `test_management/specs/artifact-version-contract.json`。
- 例: `manifest` は、全体の一覧表。具体例: `test_management/manifest.json`。
- 例: `source adapter` は、要件の出どころごとの読み方。具体例: `md` と `issue-file`。
- 似た用語が複数ある場合は、表で分ける。

## 8. 改善作業の提示粒度

改善、未対応解消、ハーネス汎用化、設計修正を提示するときは、次を最初から出す。

| 項目 | 書くこと |
|---|---|
| 目的 | 何のために直すか |
| 変更前 | 今はどうなっているか |
| 問題 | そのままだと何が困るか |
| 変更後 | 直すとどう変わるか |
| 具体例 | JSON、コマンド、ファイル名、データ例 |
| 確認方法 | どのコマンドや証跡でOKを見るか |

例:

- 変更前: `check-api-flow.mjs` に TODO CRUD が直書きされている。
- 問題: 注文、ユーザー、ログインなど別APIの確認に使えない。
- 変更後: `scenarios/*.json` に steps を書き、同じ runner で読む。
- 具体例: `POST /users`、`GET /users/${userId}` を scenario JSON に書く。
- 確認方法: `npm run check:api-flow` と `npm run check`。

## 9. 抽象助言・tipsの具体化

設計、レビュー、プロンプト、運用、tips の助言を出すときは、抽象語だけで終えない。

| 抽象語 | 必ず添えるもの | 例 |
|---|---|---|
| 契約 | schema、必須field、許可値 | `policy_id`, `confidence`, `blocking` |
| フィルタ | 判定条件、しきい値、破棄条件 | `confidence < 0.75` は投稿しない |
| 自動化 | 入力、出力、失敗時の動き | schema検証失敗時だけ1回リトライ |
| 高精度 | 評価件数、期待値、失敗例 | 過去PR20件で誤指摘率を見る |
| 安全 | 実行権限、通知、rate limit | 最初は `COMMENT` のみ、`REQUEST_CHANGES` はしない |

出力の最低条件:

- `何をするか` だけでなく、`どの値ならOKか` を書く。
- `良い / 悪い` だけでなく、`NG例 / OK例` を1つ書く。
- 仕組み化の話では、`入力例` と `出力例` を1つ書く。
- APIやCIに渡す話では、JSON field名、設定値、失敗時の扱いを書く。

例:

```json
{
  "policy_id": "ARCH-001",
  "confidence": 0.82,
  "blocking": true,
  "message": "src/lib から src/routes へ依存しています。共有層が画面都合に引きずられます。"
}
```

NG:

- `投稿前にフィルタする`

OK:

- `confidence < 0.75 は投稿しない`
- `同じ file + line + policy_id は1件に統合する`
- `line がdiff上に存在しない場合はPRに投稿せずsummaryだけに残す`

## 10. 完了の見直し

- 一度 `完了` と判断した内容でも、後からルール違反や責務混同が見つかったら `未完了` に戻す。
- `未完了に戻す理由`、`修正内容`、`再検証コマンド` をセットで出す。
- 例: `汎用実行モジュール` と言ったのに、実際は wrapper に対象pathが直書きされていた場合は未完了。
- 修正例: `run-external-tool-spec.mjs` を共通エンジン、`browser-e2e.tool.json` を個別データに分ける。

固定値の見方:

- 残してよい固定値: `schemaVersion`、許可field、usage名など、入力契約を守るための値。
- 外へ逃がす固定値: 対象path、host、port、tool CLI path、test file path、退避対象ファイル。
- 例: `file-content-policy.v1` は runner 本体で検証してよい。
- 例: `127.0.0.1`、`local-api/data/todos.json`、Playwright test path は JSON、policy、scenario、tool spec 側へ置く。
