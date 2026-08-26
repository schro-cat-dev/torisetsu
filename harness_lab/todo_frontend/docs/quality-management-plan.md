# 品質管理プラン

このファイルは、TODO アプリと品質ハーネスを一つずつ確認しながら進めるための管理ドキュメントです。

## 1. 品質管理の目的

- 実装が動くことだけでなく、なぜその UI や機構が必要かを確認する。
- UI、状態、API、保存、テスト、ハーネスの関係を辿れるようにする。
- 作業後に「何を確認済みか」「何が未確認か」が分かるようにする。

## 2. 管理ドキュメント

| ファイル | 役割 | 状態 |
|---|---|---|
| `implementation-checklist.md` | 実装作業の進捗 | 作成済み |
| `component-purpose-checklist.md` | UI ごとの目的、背景、効果、条件 | 作成済み |
| `component-relation-map.md` | UI、状態、API、保存、品質ハーネスの関係図 | 作成済み |
| `ui-feedback-review-checklist.md` | 画面フィードバックを設計、実装、E2Eへつなげる管理表 | 作成済み |
| `review-docs-and-skills-map.md` | レビュー文書とrepo内skillの対応表 | 作成済み |
| `genericity-review.md` | UI、hook、API、ハーネスの汎用性評価 | 作成済み |
| `quality-management-plan.md` | 品質管理全体の入口 | このファイル |
| `quality-harness-spec.md` | 品質ハーネスが何を、どの入力で、どう確認するかの仕様書 | 作成済み |
| `artifact-versioning.md` | 成果物バージョン管理ルール | 作成済み |
| `artifact-version-ledger.md` | バージョンごとの変更、検証、残リスク | 作成済み |
| `feedback-workstream.md` | フィードバックを改善へつなげる流れ | 作成済み |
| `runtime-operations.md` | 起動、終了、cleanup、devログ | 作成済み |
| `dev-only-test-interface-design.md` | 開発用interfaceを本番へ混ぜない設計 | 作成済み |
| `test-traceability-json-runner-design.md` | 要件md、JSON spec、tester moduleの分離設計 | 作成済み |
| `external-tool-boundary.md` | 外部ツールの信頼境界、切り替え、残リスク | 作成済み |
| `ai-review-json-gate.md` | AIレビューJSONの最小契約と表示前フィルタ | 作成済み |
| `pre-push-ai-concept-gate.md` | push/PR前にAIが概念境界をOK/NG判定する運用ゲート | 作成済み |
| `pre-push-ai-check-cheatsheet.md` | pre-push/PR前AIチェックでAIへ渡す確認表 | 作成済み |
| `test_management/manifest.json` | 要件sourceとテストspecの統括リスト | 作成済み |
| `test_management/issues/*.json` | issue型の要件source | 作成済み |
| `test_management/github_issues/*.json` | GitHub Issue fixture型の要件source | 作成済み |
| `tooling/quality-harness/profiles/*.json` | 品質ハーネスの実行セット | 作成済み |
| `tooling/quality-harness/contracts/*.json` | API contract の入力データ | 作成済み |
| `tooling/quality-harness/scenarios/*.json` | API flow の入力データ | 作成済み |
| `tooling/quality-harness/fixtures/*` | 品質ゲート用の入力サンプル | 作成済み |
| `tooling/quality-harness/external-tools/*` | 外部ツールの隔離設定 | 作成済み |
| `tooling/quality-harness/checks/*.mjs` | 個別チェックの実体 | 作成済み |

## 3. 品質ゲート

品質ハーネスの細かい仕様は `quality-harness-spec.md` を正とする。
このファイルでは、管理上の入口と進捗だけを扱う。

### 3.1 設計ゲート

- [x] 目的が書かれている。
- [x] 非ゴールが書かれている。
- [x] 保存方式が決まっている。
- [x] UI コンポーネントごとの目的が書かれている。
- [x] UI コンポーネントごとの定性効果が書かれている。
- [x] UI コンポーネントごとの定量条件が書かれている。
- [x] Mermaid 図で関係を辿れる。
- [x] 汎用性評価がある。

### 3.2 実装ゲート

- [x] `TodoPage` が主要 UI を配置している。
- [x] `useTodos` が API 通信を集約している。
- [x] `todoApi.ts` が HTTP 通信をまとめている。
- [x] `server.mjs` が JSON 保存を扱う。
- [x] 小さい UI 部品が API を直接叩いていない。
- [x] 実ブラウザで主要操作を確認する。
- [x] UIフィードバックを、ルート、配置、責務、入力項目、ノイズに分けて管理する。

### 3.3 検証ゲート

- [x] `npm run typecheck` が通る。
- [x] `npm run test:unit` が通る。
- [x] `npm run check:api-contract` が通る。
- [x] `npm run check:api-flow` が通る。
- [x] `npm run check:a11y-static` が通る。
- [x] `npm run check:artifact-version` が通る。
- [x] `npm run check:dev-only-interface-policy` が通る。
- [x] `npm run check:dev-only-build-artifact-policy` が通る。
- [x] `npm run check:harness-genericity` が通る。
- [x] `npm run check:ai-review-result` が通る。
- [x] `npm run check:test-traceability` が通る。
- [x] `npm run build` が通る。
- [x] `npm run check:api-only` で API 側だけ確認できる。
- [x] `npm run check:traceability` で要件とJSON specの対応だけ確認できる。
- [x] `npm run check:ui-static` で UI 静的確認だけ実行できる。
- [x] `npm run check:dependency-boundary` で import 境界と循環依存を確認できる。
- [x] `npm run check:browser-quality` で実ブラウザE2Eとa11yを確認できる。
- [x] Playwright で主要操作を確認する。
- [x] axe などで実ブラウザ a11y を確認する。
- [x] UIフィードバック反映後のE2E結果を台帳に残す。

### 3.4 バージョン管理ゲート

- [x] `VERSION` がある。
- [x] `package.json` の `version` と一致する。
- [x] `src/appVersion.ts` と一致する。
- [x] `artifact-version-ledger.md` に現在バージョンがある。
- [x] `npm run check` 内で `check:artifact-version` を実行する。
- [x] フィードバック反映ごとに `artifact-version-ledger.md` を更新する。

### 3.5 runtime運用ゲート

- [x] 1つのスクリプトで API と Web をまとめて起動できる。
- [x] 同じスクリプトで `start` / `stop` / `status` を実行できる。
- [x] `stop` で pid / lock を cleanup する。
- [x] `stop` で TODO 保存データを消さない。
- [x] devログで API requestId、component、event、status、durationMs を確認できる。
- [x] エラー時に error name、message、stack を確認できる。
- [x] 未管理の既存サービスを起動成功扱いにしない。

### 3.6 pre-push/PR AI判定ゲート

- [x] 人間の語感、違和感、概念上のズレを、Harnessの機械判定と分ける。
- [x] Harness化する場合は、機械で確認できる判定条件へ変換してから扱う。
- [x] push/PR前にAIが `OK / NG` と理由を出す運用ゲートを仕様化する。
- [x] AIへ渡すチェック用チートシートを別ファイルに分ける。
- [ ] AI判定結果をJSONで保存する。
- [ ] GitHub PRコメントやCIへ連携する。

## 4. 追加すべき品質チェック

優先度とおすすめ度は 5 が高い。

| 項目 | 種別 | 優先度 | おすすめ度 | 根拠 |
|---|---|---:|---:|---|
| 実ブラウザ E2E | 対応済み | 5 | 5 | Playwright で作成、検索、詳細トグル、編集モーダル、完了、削除を確認する |
| 実ブラウザ a11y | 対応済み | 5 | 5 | axe で実ブラウザ上の自動検出範囲を確認する |
| コンポーネントテスト | おすすめ | 4 | 4 | 入力エラーや disabled を小さく確認できる |
| 依存方向チェック | 対応済み | 4 | 4 | `dependency-cruiser` で import 境界と循環依存を確認する |
| ハーネス設定の外出し | 対応済み | 3 | 4 | `profiles/*.json` で実行セットを分けた |
| 要件sourceとテストの1対1管理 | 対応済み | 5 | 5 | `test_management/manifest.json` で野良テストと漏れを検出する |
| API contractのschema入力化 | 対応済み | 5 | 5 | `contracts/*.json` で対象データの形を差し替えられる |
| API flowのscenario JSON化 | 対応済み | 5 | 5 | `scenarios/*.json` でAPI手順を差し替えられる |
| 汎用runnerの個別path混入検出 | 対応済み | 5 | 5 | `harness-genericity.policy.json` で runner 側の直書きを検出する |
| AIレビューJSONの最小ゲート | 対応済み | 4 | 5 | `confidence >= 0.8`、`LOW除外`、`最大5件` を機械確認する |
| pre-push/PR AI概念境界ゲート | 運用対応 | 5 | 5 | LLMが、通常checkでは見えにくい概念の混同を読めるため |
| AIチェックチートシート | 対応済み | 5 | 5 | AIに見る順番と出力型を渡すと、判断のブレを減らせるため |
| UI価値/導線レビュー | 対応済み | 5 | 5 | 画面の違和感を、ルート、配置、入力項目、クリック範囲、重なり、ノイズの確認条件へ変換する |

## 5. 次の進め方

1. この管理ドキュメント群を読む。
2. ハーネス仕様を確認する場合は `quality-harness-spec.md` を読む。
3. どのレビュー文書やskillを見るか迷う場合は `review-docs-and-skills-map.md` を読む。
4. UIフィードバックを見る場合は `ui-feedback-review-checklist.md` を読む。
5. 足りない項目があれば、先にチェックリストへ追加する。
6. 実装する。
7. `npm run check` を実行する。
8. 実行結果を `harness_runs/` で確認する。
9. push/PR前に `pre-push-ai-check-cheatsheet.md` をAIに渡し、`pre-push-ai-concept-gate.md` の観点でOK/NGを出す。
10. 未確認項目を `implementation-checklist.md` とこのファイルに残す。

## 6. 今回の残リスク

- 実ブラウザ確認は Chromium のみ。Safari、Firefox、mobile実機は未確認。
- a11y は axe の自動検出範囲。支援技術での手動確認は未実施。
- 汎用性評価はドキュメント上の判断であり、別アプリへ転用して検証したわけではない。
- 内部バージョンはまだ Git commit や tag とは結びつけていない。
- runtime script は、このスクリプトが起動したプロセスだけを停止対象にする。
- AIレビューJSONゲートは、実際のAI API呼び出しとGitHub投稿までは扱わない。
- pre-push/PR AI概念境界ゲートは、現時点では手動のAI判断。JSON保存、CI連携、PRコメント化は未実装。
