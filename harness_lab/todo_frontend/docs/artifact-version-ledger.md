# 成果物バージョン台帳

Current version: 0.8.0

## 0.8.0

日付: 2026-08-25

### 目的

- AIレビュー結果を、GitHub自動投稿前の軽いJSONゲートとして扱う。
- `reviews: []`、必須field、`confidence >= 0.8`、`LOW` 除外、最大5件を機械確認する。
- Structured Outputs連携とGitHub投稿は、まだ対象外にする。

### 含まれるもの

- `checks/check-ai-review-result.mjs`。
- `contracts/ai-review-result.contract.json`。
- `fixtures/ai-review-results/*.json`。
- `profiles/ai-review-output.json`。
- `docs/ai-review-json-gate.md`。
- `docs/quality-harness-spec.md`。
- `test_management/requirements/ai-review-json-gate.md`。
- `test_management/specs/ai-review-json-gate.json`。
- `npm run check:ai-review-result`。
- `npm run check:ai-review-output`。

### 品質確認

- `node --check tooling/quality-harness/checks/check-ai-review-result.mjs`: OK。
- `npm run check:ai-review-result`: OK。3 samples。
- `npm run check:ai-review-output`: OK。最新確認: `harness_runs/2026-08-25T04-50-29-098Z-60465/summary.md`。
- `npm run check:test-traceability`: OK。5 cases。
- `npm run check:artifact-version`: OK。`0.8.0`。
- `npm run check:harness-genericity`: OK。
- `npm run check:ui-static`: OK。最新確認: `harness_runs/2026-08-25T04-50-38-984Z-61144/summary.md`。
- `python3 /Users/yutoseki/.codex/skills/codex-skill-maintenance/scripts/validate_skills.py .agents/skills`: OK。`checked=6 errors=0`。
- `HARNESS_ENABLE_DEPENDENCY_BOUNDARY=1 HARNESS_ENABLE_BROWSER_QUALITY=1 npm run check`: OK。最新確認: `harness_runs/2026-08-25T04-52-16-755Z-67167/summary.md`。
- `docs/quality-harness-spec.md` を追加し、各checkの `観点 / 入力 / 確認項目 / 実現方法 / OK条件 / 証跡 / 残リスク` を明文化した。

### 残リスク

- 実際のAI API呼び出しは未実装。
- Structured OutputsのAPI連携は未実装。
- GitHub PRへのinline投稿は未実装。
- diff行マッピング、重複排除、`blocking` 判定は未実装。

## 0.7.0

日付: 2026-08-25

### 目的

- dependency-cruiser で import 境界と循環依存を機械確認する。
- Playwright と axe で、実ブラウザE2Eと実ブラウザa11yを追加する。
- 外部ツールをアプリ本体から隔離し、通常checkではフラグで切り替える。

### 含まれるもの

- `dependency-cruiser@17.4.3`。
- `@playwright/test@1.55.1`。
- `@axe-core/playwright@4.10.2`。
- `checks/run-file-content-policy.mjs`。
- `tooling/quality-harness/external-tools/dependency-cruiser/`。
- `tooling/quality-harness/external-tools/playwright/`。
- `checks/run-external-tool-spec.mjs`。
- `policies/harness-genericity.policy.json`。
- `external-tools/dependency-cruiser/dependency-boundary.tool.json`。
- `external-tools/playwright/browser-e2e.tool.json`。
- `external-tools/playwright/browser-a11y.tool.json`。
- `profiles/dependency-boundary.json`。
- `profiles/browser-quality.json`。
- `run-quality-harness.mjs` の `optionalEnv` 対応。
- `HARNESS_ENABLE_DEPENDENCY_BOUNDARY=1` と `HARNESS_ENABLE_BROWSER_QUALITY=1` による通常check内の切り替え。
- `docs/external-tool-boundary.md`。
- 汎用runnerに残してよい固定値と、JSONへ逃がす固定値の線引き。
- API flow の `protocol` / `host` を `scenario.json` 側へ移動。
- traceability の `specDir` / `testerModuleDir` を `manifest.json` 側へ移動。

### 品質確認

- `node --check tooling/quality-harness/checks/check-api-flow.mjs`: OK。
- `node --check tooling/quality-harness/checks/check-test-traceability.mjs`: OK。
- `node --check tooling/quality-harness/checks/run-file-content-policy.mjs`: OK。
- `npm run check:harness-genericity`: OK。`tooling/quality-harness` 配下の `.mjs` で個別path直書きを確認。
- `npm run check:test-traceability`: OK。4 cases。
- `npm run check:traceability`: OK。最新確認: `harness_runs/2026-08-25T04-36-12-358Z-22334/summary.md`。
- `npm run check:api-flow`: OK。`todo-crud 4 steps`。
- `npm run check:ui-static`: OK。最新確認: `harness_runs/2026-08-25T04-39-38-528Z-31925/summary.md`。
- `python3 /Users/yutoseki/.codex/skills/codex-skill-maintenance/scripts/validate_skills.py .agents/skills`: OK。`checked=6 errors=0`。
- `HARNESS_ENABLE_DEPENDENCY_BOUNDARY=1 HARNESS_ENABLE_BROWSER_QUALITY=1 npm run check`: OK。最新確認: `harness_runs/2026-08-25T04-40-00-569Z-33236/summary.md`。

### 残リスク

- 実ブラウザE2Eは Chromium のみ。
- a11y は axe の自動検出範囲のみ。
- 実ブラウザでの編集フローはまだ専用E2Eに含めていない。
- dependency-cruiser は静的import解析であり、実行時の動的依存は対象外。

## 0.6.0

日付: 2026-08-25

### 目的

- 未対応1〜7を、ハーネスの汎用化としてまとめて改善する。
- API contract と API flow を TODO 固定から JSON 入力型へ変える。
- profile、tester module、traceability、dev-only確認の契約を強める。

### 含まれるもの

- `profiles/*.json` の `quality-harness-profile.v1` 化。
- `run-quality-harness.mjs` の未知field禁止と `requires` 順序チェック。
- `contracts/todos.contract.json`。
- `check-api-contract.mjs` の schema入力化。
- `scenarios/todo-crud.scenario.json`。
- `check-api-flow.mjs` の scenario JSON化。
- `check-test-traceability.mjs` の result JSON出力。
- `tester-modules/*.mjs` の `metadata` / `validateInput` 契約。
- `github-issue-fixture` source adapter。
- `check-dev-only-build-artifact-policy.mjs`。
- `runId` に `process.pid` を含め、並列実行時の出力先衝突を避ける。
- 報告粒度ルールの skill / AGENTS.md 反映。

### 品質確認

- `node --check tooling/quality-harness/run-quality-harness.mjs`: OK。
- `node --check tooling/quality-harness/checks/check-api-contract.mjs`: OK。
- `node --check tooling/quality-harness/checks/check-api-flow.mjs`: OK。
- `node --check tooling/quality-harness/checks/check-test-traceability.mjs`: OK。
- `node --check tooling/quality-harness/checks/check-dev-only-build-artifact-policy.mjs`: OK。
- `python3 /Users/yutoseki/.codex/skills/codex-skill-maintenance/scripts/validate_skills.py .agents/skills`: OK。`checked=6 errors=0`。
- `npm run check:api-flow`: OK。`todo-crud 4 steps`。
- `npm run check:api-only`: OK。最新確認: `harness_runs/2026-08-25T04-04-50-782Z-33942/summary.md`。
- `npm run check:traceability`: OK。最新確認: `harness_runs/2026-08-25T04-04-57-675Z-34373/summary.md`。
- `npm run check:ui-static`: OK。最新確認: `harness_runs/2026-08-25T04-04-57-670Z-34374/summary.md`。
- `npm run check`: OK。最新確認: `harness_runs/2026-08-25T04-04-37-891Z-32956/summary.md`。

### 残リスク

- GitHub Issue APIへの直接接続は未実装。
- Playwright E2E と実ブラウザ a11y は未実装。
- `run-quality-harness.mjs` は result JSON の中身までは summary に集約していない。

## 0.5.0

日付: 2026-08-25

### 目的

- 要件連携先を `md` 固定から、source adapter方式へ広げる。
- `md` と `issue-file` を同じ traceability check で扱えるようにする。
- `テストspec` などの用語が粗くならないよう、定義と具体例を明記する。

### 含まれるもの

- `test_management/manifest.json` の `test-manifest.v2` 化。
- `requirementSources` による `md` / `issue-file` source定義。
- `test_management/issues/traceability-source-adapter.json`。
- `test_management/specs/traceability-source-adapter.json`。
- `check-test-traceability.mjs` の source adapter対応。
- `docs/test-traceability-json-runner-design.md` の説明補強。

### 品質確認

- `node --check tooling/quality-harness/checks/check-test-traceability.mjs`: OK。
- `npm run check:artifact-version`: OK。`0.5.0` の整合性を確認。
- `npm run check:test-traceability`: OK。3 cases。
- `npm run check:traceability`: OK。最新確認: `harness_runs/2026-08-25T03-38-57-279Z/summary.md`。
- `npm run check:ui-static`: OK。最新確認: `harness_runs/2026-08-25T03-37-47-735Z/summary.md`。
- `npm run check`: OK。最新確認: `harness_runs/2026-08-25T03-37-58-775Z/summary.md`。

### 残リスク

- GitHub Issue API adapterは未実装。
- 外部Issue APIの認証、キャッシュ、取得失敗時の扱いは未設計。

## 0.4.0

日付: 2026-08-25

### 目的

- 開発用インターフェースを本番sourceへ混ぜないguardを追加する。
- 要件md、JSON spec、tester moduleを分離し、要件とテストの1対1対応を確認できるようにする。
- テスト実行moduleと個別データを分け、同じmoduleを別specでも使える形にする。

### 含まれるもの

- `docs/dev-only-test-interface-design.md`。
- `docs/test-traceability-json-runner-design.md`。
- `tooling/quality-harness/checks/check-dev-only-interface-policy.mjs`。
- `tooling/quality-harness/checks/check-test-traceability.mjs`。
- `tooling/quality-harness/test-runner/tester-modules/file-contains.mjs`。
- `tooling/quality-harness/test-runner/tester-modules/json-field-equals.mjs`。
- `test_management/manifest.json`。
- `test_management/requirements/*.md`。
- `test_management/specs/*.json`。
- `npm run check:traceability`。

### 品質確認

- `node --check tooling/quality-harness/checks/check-dev-only-interface-policy.mjs`: OK。
- `node --check tooling/quality-harness/checks/check-test-traceability.mjs`: OK。
- `node --check tooling/quality-harness/test-runner/tester-modules/*.mjs`: OK。
- `npm run check:artifact-version`: OK。`0.4.0` の整合性を確認。
- `npm run check:dev-only-interface-policy`: OK。
- `npm run check:test-traceability`: OK。2 cases。
- `npm run check:traceability`: OK。最新確認: `harness_runs/2026-08-25T03-31-03-908Z/summary.md`。
- `npm run check`: OK。最新確認: `harness_runs/2026-08-25T03-31-20-945Z/summary.md`。
- `npm run check:ui-static`: OK。最新確認: `harness_runs/2026-08-25T03-31-33-534Z/summary.md`。

### 残リスク

- TS / JS のAST削除pluginは未実装。
- GitHub Issue APIとは未連携。
- 実ブラウザ操作のJSON specは未作成。

## 0.3.0

日付: 2026-08-25

### 目的

- 品質ハーネスの runner、実行セット、個別チェックの責務を分ける。
- 同じ runner で `default`、`api-only`、`ui-static` を切り替えられるようにする。

### 含まれるもの

- `tooling/quality-harness/run-quality-harness.mjs` による profile 読み込み。
- `tooling/quality-harness/profiles/default.json`。
- `tooling/quality-harness/profiles/api-only.json`。
- `tooling/quality-harness/profiles/ui-static.json`。
- `tooling/quality-harness/checks/*.mjs` への個別チェック移動。
- `npm run check:api-only` と `npm run check:ui-static`。

### 品質確認

- `node --check tooling/quality-harness/run-quality-harness.mjs`: OK。
- `node --check tooling/quality-harness/checks/*.mjs`: OK。
- `npm run check:artifact-version`: OK。`0.3.0` の整合性を確認。
- `npm run check:ui-static`: OK。最新確認: `harness_runs/2026-08-25T03-14-48-495Z/summary.md`。
- `npm run check`: OK。最新確認: `harness_runs/2026-08-25T03-13-38-575Z/summary.md`。
- `npm run check:api-only`: OK。最新確認: `harness_runs/2026-08-25T03-13-58-485Z/summary.md`。

### 残リスク

- API contract / API flow はまだ TODO 専用。
- 実ブラウザ E2E と実ブラウザ a11y は未導入。

## 0.2.0

日付: 2026-08-25

### 目的

- runtime側の未対応を対応済みにする。
- 1コマンド起動、終了、status、cleanup、devログ、エラーログをそろえる。

### 含まれるもの

- `runtime_scripts/todo_frontend_runtime.mjs` による `start` / `stop` / `status`。
- `stop` 時の pid / lock cleanup。
- TODO保存データ `local-api/data/todos.json` を消さない終了処理。
- API の requestId 付き構造化ログ。
- API のエラーログ `name` / `message` / `stack`。
- `docs/runtime-operations.md` による runtime 運用説明。

### 品質確認

- `node runtime_scripts/todo_frontend_runtime.mjs start`: OK。API と Web が `managed=true / health=true`。
- `node runtime_scripts/todo_frontend_runtime.mjs status`: OK。API と Web の状態を表示。
- `curl -H 'X-Request-Id: verify-runtime-log-001' http://127.0.0.1:4174/api/todos`: OK。APIログに requestId、storage read、durationMs を出力。
- 未管理API起動中の `node runtime_scripts/todo_frontend_runtime.mjs start`: OK。未管理サービスを検出し、成功扱いせず終了。
- `node runtime_scripts/todo_frontend_runtime.mjs stop`: OK。pid / lock を削除し、TODO保存データを保持。
- `npm run check`: OK。
- 最新確認: `harness_runs/2026-08-24T19-46-09-146Z/summary.md`。

### 残リスク

- 実ブラウザでの手動操作確認は未実施。
- runtime script は、このスクリプトが起動したプロセスだけを停止対象にする。

## 0.1.0

日付: 2026-08-25

### 目的

- TODO アプリを材料にして、品質確認ハーネスとツール連携を試す。
- ローカルだけで UI、API、JSON 保存、品質チェックを回せる状態にする。

### 含まれるもの

- React + Vite + React Router の TODO UI。
- Node 標準ライブラリのローカル API。
- `local-api/data/todos.json` による JSON 保存。
- 階層化した実装チェックリスト。
- UI 目的・効果チェックリスト。
- Mermaid による関係マップ。
- 汎用性レビュー。
- 品質管理プラン。
- `npm run check` による品質ハーネス。

### 品質確認

- `npm install`: OK。
- `npm run check`: OK。
- 最新確認: `harness_runs/2026-08-24T18-41-50-424Z/summary.md`。

### 残リスク

- 実ブラウザでの手動操作確認は未実施。
- Playwright E2E は未導入。
- 実ブラウザ a11y は未導入。
- API と品質チェックはまだ TODO 専用寄り。

### 次に見ること

- UI コンポーネント単位の目的と効果が画面上で成立しているか。
- ハーネス機構をどこまで汎用化するか。
- Playwright / axe を追加するか。
