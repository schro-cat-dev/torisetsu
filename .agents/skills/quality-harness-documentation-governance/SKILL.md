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

見出しと説明:

- 時間訴求の見出し、曖昧な程度語、過剰な称賛語、完成度を誇張する語のような、情報を増やさない修飾語を使わない。
- `概要`、`対象`、`入力`、`出力`、`判断条件`、`完了条件`、`残リスク` のように、読者が何を確認できるかで見出しを付ける。
- 非担当者への引き継ぎに必要な説明は削らない。
- 品質ハーネスや検証結果は、初見の非担当者が対象、目的、実行コマンド、期待結果、実結果、失敗時の確認先を追える粒度で残す。

品質水準を書く時の注意:

- 対象スコープを勝手に上げない。
- ローカル実験用TODOアプリを、根拠なく `SaaS品質` のように呼ばない。
- 外部公開、本番運用、SaaS、業務利用などを評価する場合は、その前提を明示する。
- 未評価の領域は、低品質と断定せず `対象外` または `未評価` と書く。

例:
- NG: `本番SaaS品質ではない`
- OK: `今回の品質評価はローカル実験用TODOアプリとしての評価。外部公開・本番運用は対象外`

`5 / 5 に足りないもの` を書く時:

- 抽象語だけで終わらせない。
- `何をするか`、`どう確認するか`、`OKの例` をセットにする。
- 例: `mobile確認が必要` だけではなく、`375px幅で作成modal、詳細toggle、分類バーを確認し、分類バー以外が横にはみ出さないことを見る` と書く。
- 例: `失敗ケースが必要` だけではなく、`空タイトル、81文字タイトル、API 500、title click誤動作を入れて、期待どおり止まるかを見る` と書く。

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

遵守するべきルールとして作るツールや、ハーネスに組み込むツールは、基本的に汎用性を担保する。

| 分けるもの | 持たせる内容 | 例 |
|---|---|---|
| ツール本体 | 共通処理、入力検証、結果出力 | JSONを読む、schemaVersionを見る、OK/NGを返す |
| config / policy / scenario / contract | 具体的なルール、対象scope、path、しきい値、期待値 | `TodoListItem`、`80文字上限`、`API 500時の期待結果` |
| loader | 外部入力を内部表現へそろえる | JSONを読んでrunnerへ渡す |
| result | 実行結果と証跡 | `status: ok`、失敗箇所、実行時刻 |

ここでの `外部から渡す` は、configやデータを実行時に注入するという意味で扱う。

ツール本体に対象ごとの分岐を増やさない。

実装や具体サンプルが必要な場合は、`.agents/skills/config-driven-harness-tooling/SKILL.md` を読む。

OK例:
- `run-file-content-policy.mjs` は共通runner。
- `dev-only-interface.policy.json` は対象path、禁止prefix、許可例を持つ。
- 新しいpolicyを追加しても、runner本体は変えない。

NG例:
- `run-file-content-policy.mjs` の中に `src/features/todos`、`_test`、`80` など対象固有の値を書く。
- TODO用、採用プラットフォーム用、DB用で似たrunnerを毎回作る。

受け入れ条件:
- 新しい対象やルールを追加するとき、ツール本体のdiffがゼロに近い。
- 変えるのは config、policy、scenario、contract 側で済む。
- 実行結果は同じ形式で保存される。
- 速度、品質、再現性、低コスト化に効く説明がある。

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

## 8. ハーネス価値の説明

ハーネスの価値を `業務速度が上がる` だけで説明して終わらせない。

業務速度の改善は重要だが、次も明示する。

| 要素 | 書くこと | 例 |
|---|---|---|
| 暗黙知 | 何をチートシート化するか | UIクリック範囲、設計判断、DB削除影響 |
| 対象との関連 | どの対象、scope、flow、componentに結びつくか | `TodoListItem`、`F2`、`ui` |
| 観点 | どの見方で確認するか | 提供価値、責務、依存関係、UX、a11y |
| チェックリスト | 何を見ればOKか | title clickでdoneにならない |
| 再利用module | 何を使い回せるか | JSON contract checker、browser flow checker |
| 検索用メタ情報 | AIが探すための手がかり | `tags`、`scope`、`qualityScore`、`relatedFlowIds` |
| 品質チェック機構 | どの範囲を取り出して確認するか | `TodoListItem` のクリック分離だけE2E |

2層で見る:

| 層 | 見るもの | 例 |
|---|---|---|
| 第1層 | 対象、スコープ、処理フロー、ID | `todo_frontend`、`ui`、`F2` |
| 第2層 | 観点、タグ、暗黙知、チェックリスト、品質ゲート | `event-propagation`、`click-area`、`browser-e2e` |

OK例:
- `ハーネスで速度を上げる` だけではなく、`TodoListItem / ui / F2 に対して、click-area の暗黙知と browser-e2e を紐づけ、title clickでdoneにならないことを見る` と書く。

NG例:
- `暗黙知を管理する`
- `検索しやすくする`
- `品質保証する`

理由:
- 対象、観点、確認方法がないと、次に何を作るか分からないため。
