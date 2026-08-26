---
name: app-runtime-operations-governance
description: "Use when creating, modifying, reviewing, or documenting a runnable local app, dev server, API service, database-backed tool, runtime script, process lifecycle, service logger, or server-side error logging. Covers one-command start/stop/status, cleanup without deleting data, dev observability, and detailed console logs."
---

# App Runtime Operations Governance

この skill は、ローカルで動かすシステムの起動、終了、cleanup、devログを扱う。

## 1. スコープ

対象:
- アプリ、API、DB、worker、queue、cache などのローカルサービス。
- 起動、終了、状態確認、プロセス管理。
- dev時のサービス状態ログとエラーログ。

対象外:
- 品質ハーネスの説明ドキュメント。
- UI設計チェックリスト。
- テスト観点の一覧化。

## 2. 起動と終了

- 1つのスクリプトで全サービスを起動できるようにする。
- 同じスクリプトに `start`、`stop`、`status` を用意する。
- `stop` は、そのスクリプトが起動したプロセスをまとめて止める。
- `stop` は pid、temp、lock、port などの作業用リソースを片付ける。
- `stop` は local JSON、DB、ユーザー作成データ、検証用の保存データを消さない。
- データ削除が必要な場合は `reset` などの別コマンドに分け、実行前に明示する。
- ユーザーへURLを提示する前は、`status` で古いpidや未管理サービスを確認し、必要なら `stop` で管理ファイルをcleanupしてから `start` する。
- URLを提示する時は、APIとWebの `health=true` を確認してから出す。
- sandbox外の権限付きで起動した場合は、URL確認も同じ権限文脈で `status` と `curl` を見る。通常sandboxの `status` が false でも、権限差による見え方の可能性がある。

最低限の形:

```text
<script> start
<script> stop
<script> status
```

URL提示前の形:

```text
<script> status
<script> stop
<script> start
<script> status
```

`stop` は保存データを消さない前提で使う。

## 3. devログ

- devでは、サービス内部の状態を細かくログに出す。
- API、DB接続、データ保存、外部連携、同期処理、worker、queue、cache は状態変化を出す。
- エラー時は、サーバー側をすぐ調査できる粒度で出す。
- できればコンソール出力だけで、どこで何が失敗したか分かるようにする。
- token、password、secret、個人情報、機密本文は出さない。必要ならマスクする。

ログ項目:

```text
time / level / service / component / event / requestId / status / durationMs / error
```

## 4. 未対応の扱い

ここでの `未対応` は、この skill のスコープ内だけを指す。

例:
- `未対応: start/stop/status の一括スクリプトがない`
- `未対応: APIリクエストごとの requestId ログがない`
- `未対応: DB接続失敗時の詳細ログがない`

別スコープの品質不足は、この skill に混ぜない。

## 5. 未対応を残さない

- runtime側の未対応を見つけたら、原則として未対応のまま報告して終えない。
- `start/stop/status がない`、`cleanup がない`、`devログが粗い`、`エラーログが足りない` は、実装と確認まで進める。
- 対応できない場合だけ、スコープ、理由、代替案、残リスク、次の実装手順を書く。
- 品質水準を満たしていないものを、対応済みのように見せない。
- 考えすぎて止まらず、必要な確認をしたらファイル、スクリプト、検証結果という形にする。
