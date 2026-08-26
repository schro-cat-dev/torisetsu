---
name: quality-harness-documentation-governance
description: "Use when creating, modifying, reviewing, or documenting a quality harness, verification gate, test suite, check script, evidence summary, quality report, or validation plan that needs concrete quality viewpoints, check items, rationale, commands, expected results, actual results, residual risks, and next improvements."
---

# Quality Harness Documentation Governance

この skill は、品質ハーネスの説明粒度をそろえるために使う。

## 1. スコープ

対象:
- 品質ハーネス。
- テスト、check script、検証ゲート。
- 検証結果の summary、証跡、残リスク。

対象外:
- ローカルサービスの起動、終了、cleanup。
- dev時のサーバーログ設計。

## 2. 必須項目

品質ハーネスを作ったら、次を具体的に書く。

| 項目 | 書くこと |
|---|---|
| 観点 | 何の品質を見るか。例: 型、安全性、API契約、UI操作 |
| 確認項目 | 具体的に何を確認するか |
| 判断根拠 | なぜその確認で現実的に十分と言えるか |
| 実現方法 | どのコマンド、テスト、scriptで確認するか |
| 期待結果 | OKの条件 |
| 実結果 | 実行結果、summary、ログ |
| 残リスク | まだ見ていないこと |
| 次の改善 | 足すなら何を足すか |

品質水準を書く時の注意:

- 対象スコープを勝手に上げない。
- ローカル実験用TODOアプリを、根拠なく `SaaS品質` のように呼ばない。
- 外部公開、本番運用、SaaS、業務利用などを評価する場合は、その前提を明示する。
- 未評価の領域は、低品質と断定せず `対象外` または `未評価` と書く。

例:
- NG: `本番SaaS品質ではない`
- OK: `今回の品質評価はローカル実験用TODOアプリとしての評価。外部公開・本番運用は対象外`

## 3. 未対応の扱い

ここでの `未対応` は、品質ハーネス説明の不足だけを指す。

例:
- `未対応: API失敗時のUI表示を実ブラウザで確認していない`
- `未対応: 判断根拠がコマンド名だけで、品質観点と結びついていない`
- `未対応: summaryはあるが、残リスクが粗い`

runtime、logger、起動終了の不足は、この skill に混ぜない。

## 4. 改善報告の粒度

品質ハーネスの未対応や改善案を出すときは、簡略化しすぎない。

必ず書くもの:

| 項目 | 内容 |
|---|---|
| 変更前 | 現在のファイル、データ、コマンドの形 |
| 困る例 | そのままだと失敗する別用途の例 |
| 変更後 | どういう構造に変えるか |
| データ例 | JSON、scenario、schema、resultの例 |
| 自動化範囲 | どこまで機械確認できるか |
| 未自動化 | まだ人間確認や今後実装が必要なこと |

例:
- `API contractをschema入力化`: `todos.json` 固定から `contracts/*.json` 入力に変える。
- `API flowをscenario JSON化`: API手順をコード直書きから `scenarios/*.json` に移す。
- `traceability結果JSON出力`: `summary.md` は概要、詳細は `test-traceability.results.json` に分ける。

## 5. 完了扱いの取り消し

チェックリストで完了にした後でも、実装を見て次が残っていたら未完了へ戻す。

| 未完了へ戻す条件 | 具体例 | 修正後 |
|---|---|---|
| 汎用runnerに個別pathが直書き | `check-browser-quality.mjs` に Playwright test path と `todos.json` が直書き | `run-external-tool-spec.mjs` + `browser-e2e.tool.json` |
| 同じ種類のscanが専用scriptに分かれている | `check-dev-only-interface-policy.mjs` と `check-dev-only-build-artifact-policy.mjs` が別々に対象dir/prefixを持つ | `run-file-content-policy.mjs` + `*.policy.json` |
| 環境値がrunnerに直書き | API flow runnerに `127.0.0.1` が直書き | `scenario.json` の `server.host` に置く |
| 置き場所がrunnerに固定 | traceability runnerが `test_management/specs` や `tester-modules` を固定 | `manifest.json` の `specDir` / `testerModuleDir` に置く |
| 完了チェックだけ更新して検証がない | checklistだけ `[x]` だが `npm run check:*` 未実行 | 対応するコマンドを実行して台帳に残す |

必ず同時に直すもの:

- 実装
- 管理ドキュメント
- チェックリスト
- 検証コマンド
- バージョン台帳

## 6. 汎用runnerの固定値ルール

runner本体に残してよい固定値と、JSONへ逃がす固定値を分ける。

| 種類 | 扱い | 例 |
|---|---|---|
| 入力契約 | runnerに残してよい | `file-content-policy.v1`、`external-tool-check.v1`、許可field一覧 |
| 結果契約 | runnerに残してよい | `file-content-policy-result.v1`、`status: ok / failed` |
| 個別対象 | JSONへ逃がす | `src/features/todos`、`local-api/data/todos.json` |
| 環境値 | JSONへ逃がす | `127.0.0.1`、port、起動command |
| 外部tool詳細 | JSONへ逃がす | Playwright CLI path、dependency-cruiser CLI path、test file path |

具体例:
- OK: `run-file-content-policy.mjs` が `policy.schemaVersion === "file-content-policy.v1"` を確認する。
- NG: `run-file-content-policy.mjs` が `src/features/todos` や `_test` を直書きする。

完了前チェック:

- `checks/` だけでなく、runner本体、tester module、共通loader、共通formatterも見る。
- `rg` または `harness-genericity.policy.json` のような専用policyで、個別pathや外部tool pathの直書きがないことを確認する。
- 直書きが見つかった場合は、完了済みのチェックリストを未完了に戻し、実装、policy、docs、台帳、検証を同時に直す。
- 個別データ側の `scenario.json`、`contract.json`、`*.tool.json`、`*.policy.json` に path や tool 名があるのはOK。

## 7. AI生成レビュー出力の最小ゲート

AIレビュー、AIコメント、AI指摘を品質ハーネスで扱う場合は、最初から外部投稿まで作らない。

まず作るもの:

| 項目 | 最小ルール |
|---|---|
| 出力契約 | `reviews` 配列だけを受け取る。問題なしは `reviews: []` |
| 必須field | `file`, `line`, `severity`, `policy_id`, `message`, `suggestion`, `confidence` |
| confidence | `confidence >= 0.8` だけ残す |
| severity | `LOW` は表示対象から外す |
| 件数上限 | confidenceが高い順で最大5件 |
| 非ゴール | GitHub投稿、diff行マッピング、重複排除、`blocking` 判定は後回し |

具体例:

- 変更前: AIが出したレビュー文をそのまま表示、またはPRに投稿する。
- 変更後: `check-ai-review-result.mjs` のようなrunnerで contract と fixture を検査し、表示前に低confidenceと `LOW` を落とす。
- 確認方法: `npm run check:ai-review-result` のような軽い専用checkを作る。
