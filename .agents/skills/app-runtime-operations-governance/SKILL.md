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

- ローカルでも、必要がないならサーバーを立てない。
- まず、サーバーなしで目的を達成できるか見る。
- docs確認、静的check、unit test、コード読解、軽い設計相談だけで足りる場合は、サーバー起動をしない。
- Reactなどのフロントエンドでも、ビルド済みの静的画面確認だけで足りる場合は、`file/path` や静的HTML確認を候補にする。
- サーバー起動は、API連携、route遷移、ブラウザevent、保存処理、実ブラウザE2E、複数サービス連携の確認に必要な時だけ使う。
- API、裏側のJSON保存、SPAのroute fallback、devログ、E2E証跡が関係する場合は、ローカルサーバを1つの中継点にした方が管理コストが下がることがある。
- 起動前に、`目的`、`必要な理由`、`サーバなしの代替`、`ROI` を短く確認する。
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

サーバー起動の判断例:

| 場面 | 判断 | 理由 |
|---|---|---|
| docsだけ更新 | 起動しない | ファイル確認で十分 |
| CSSの軽微な相談 | 原則起動しない | 方針確認だけなら不要 |
| 静的画面の見た目だけ確認 | `file/path` や静的HTMLを先に候補 | サーバなしで足りる可能性がある |
| クリック範囲の確認 | 起動する | ブラウザeventを見る必要がある |
| API保存の確認 | 起動する | 実際の保存結果を見る必要がある |
| React + API + JSON保存 | 起動する寄り | ブラウザ制約、route、保存、ログを同じ入口で追える |
| URLだけ提示 | 起動済みならstatus確認だけ | 新規起動は不要なことがある |

判断の目安:

| 確認したいこと | 軽い候補 | サーバが有効な条件 |
|---|---|---|
| 見た目 | 静的HTML、build成果物、screenshot | CSSやasset pathがdev server前提 |
| 画面操作 | browserでfile/path表示 | event、modal、route、状態保存まで見る |
| データ | fixtureやunit test | API、JSON保存、DB、同期を見る |
| エラー | static check | サーバ側ログ、requestId、保存失敗を見る |
| E2E | なし、または限定確認 | Playwrightなどで実ブラウザとAPIを通す |

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
