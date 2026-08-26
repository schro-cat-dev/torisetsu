# 品質ハーネス仕様書

このファイルは、TODO Quality Harness が何を、どの入力で、どう確認し、何を OK とするかを一枚で追うための仕様書です。

## 1. 結論

- 仕様書の本体: `docs/quality-harness-spec.md`
- 実行入口: `tooling/quality-harness/run-quality-harness.mjs`
- 実行セット: `tooling/quality-harness/profiles/*.json`
- 個別確認: `tooling/quality-harness/checks/*.mjs`
- 入力データ: `contracts/*.json`、`scenarios/*.json`、`policies/*.json`、`external-tools/*.tool.json`、`test_management/manifest.json`
- 実行証跡: `harness_runs/*/summary.md` と `harness_runs/*/*.results.json`

## 2. スコープ

対象:

- ローカル TODO アプリの型、unit、API契約、APIフロー、UI静的確認、実ブラウザ確認。
- ハーネス自体の汎用性、要件とテストの対応、AIレビューJSONの最小ゲート。
- 外部ツールを使う確認の信頼境界と切り替え。
- push/PR前にAIが差分を読み、概念境界の混同をOK/NG判定する運用ゲート。

対象外:

- 本番DB、認証、権限管理。
- 実AI API呼び出し。
- GitHub PRへの自動投稿。
- Safari、Firefox、mobile実機での確認。

## 3. 実行コマンド

| コマンド | 目的 | 実行する主な確認 | 証跡 |
|---|---|---|---|
| `npm run check` | 通常確認 | version、汎用性、dev-only、AIレビューJSON、traceability、型、unit、API、静的a11y、build | `harness_runs/*/summary.md` |
| `HARNESS_ENABLE_DEPENDENCY_BOUNDARY=1 npm run check` | 通常確認に依存方向チェックを追加 | `dependency-cruiser` による import 境界と循環依存 | `dependency-boundary.results.json` |
| `HARNESS_ENABLE_BROWSER_QUALITY=1 npm run check` | 通常確認に実ブラウザ確認を追加 | Playwright E2E、Playwright + axe | `browser-e2e.results.json`、`browser-a11y.results.json` |
| `npm run check:api-only` | APIだけ短く確認 | API contract、API flow | `summary.md` |
| `npm run check:ui-static` | UI静的確認だけ短く確認 | dev-only、traceability、typecheck、unit、static a11y、build | `summary.md` |
| `npm run check:traceability` | 要件とテスト対応だけ確認 | manifest、requirement source、JSON spec、tester module | `test-traceability.results.json` |
| `npm run check:dependency-boundary` | 依存方向だけ確認 | dependency-cruiser | `dependency-boundary.results.json` |
| `npm run check:browser-quality` | 実ブラウザだけ確認 | browser E2E、browser a11y | `browser-*.results.json` |
| `npm run check:ai-review-output` | AIレビューJSONだけ確認 | schema、field、confidence、severity、最大件数 | `ai-review-result-gate.results.json` |

LLM/AI運用ゲート:

| ゲート | 目的 | 実行する主な確認 | 証跡 |
|---|---|---|---|
| pre-push/PR AI概念境界ゲート | push/PR前に、通常checkでは見えにくい概念の混同をAIが読む | 人間の違和感、観察、解釈、機械判定が混ざっていないか | `docs/pre-push-ai-concept-gate.md`、最終報告、必要なら会話ログ |

最新の外部ツール込み確認:

- `npm run check:dependency-boundary`
- 結果: OK
- 証跡: `harness_runs/2026-08-26T17-30-13-859Z-72878/summary.md`

最新の実ブラウザ確認:

- `npm run check:browser-quality`
- 結果: OK
- 証跡: `harness_runs/2026-08-26T17-26-39-427Z-63092/summary.md`

## 4. 構成

| 部品 | 役割 | 汎用性の扱い |
|---|---|---|
| `run-quality-harness.mjs` | profile を読み、checkを順番に実行し、summaryを保存する | 汎用runner。対象pathやtool詳細は持たない |
| `profiles/*.json` | どのcheckをどの順番で実行するかを定義する | 実行セットを差し替え可能 |
| `checks/*.mjs` | contract、scenario、policy、tool specを読んで確認する | 入力契約だけを固定し、個別対象はJSONへ逃がす |
| `contracts/*.json` | APIやAIレビュー結果の期待構造を定義する | 対象データを差し替え可能 |
| `scenarios/*.json` | APIの手順、host、port、restore対象を定義する | CRUD以外のAPIへ広げられる |
| `policies/*.json` | 禁止文字列、対象dir、対象拡張子を定義する | ルールだけを差し替え可能 |
| `external-tools/*.tool.json` | 外部toolのCLI、config、test file、restore fileを定義する | runnerから外部tool詳細を分離 |
| `docs/pre-push-ai-check-cheatsheet.md` | AIへ渡すpre-push/PR前チェック表 | LLMが見る順番と出力型を固定する |
| `test_management/manifest.json` | 要件sourceとJSON specの対応を管理する | md、issue-file、GitHub issue fixtureに対応 |
| `harness_runs/*` | 実行結果とsummaryを保存する | 後から確認できる証跡 |

## 5. 個別チェック仕様

### 5.1 成果物バージョン

| 項目 | 内容 |
|---|---|
| check | `artifact-version` |
| 観点 | 成果物の版がファイル間でずれていないか |
| 入力 | `tooling/quality-harness/contracts/artifact-version.contract.json` |
| 確認項目 | `VERSION`、`package.json`、`src/appVersion.ts`、`docs/artifact-version-ledger.md` の version |
| 実現方法 | `npm run check:artifact-version` |
| OK条件 | すべて `0.8.2` で一致する |
| 証跡 | `summary.md` の `artifact-version: OK` |
| 残リスク | Git tag や commit hash との自動対応はまだない |

### 5.2 ハーネス汎用性

| 項目 | 内容 |
|---|---|
| check | `harness-genericity` |
| 観点 | 汎用runnerにTODO専用pathや外部tool pathが直書きされていないか |
| 入力 | `tooling/quality-harness/policies/harness-genericity.policy.json` |
| 確認項目 | `.mjs` 内に `src/features/todos`、`local-api/data/todos.json`、`127.0.0.1`、Playwright CLI path などが混ざっていないこと |
| 実現方法 | `npm run check:harness-genericity` |
| OK条件 | 禁止文字列が0件 |
| 証跡 | `harness-genericity-policy.results.json` |
| 残リスク | 文字列検出なので、意味的に同じ別表現までは検出しない |

### 5.3 dev-only source 混入防止

| 項目 | 内容 |
|---|---|
| check | `dev-only-interface-policy` |
| 観点 | 本番sourceへ開発専用interfaceを混ぜていないか |
| 入力 | `tooling/quality-harness/policies/dev-only-interface.policy.json` |
| 確認項目 | `src` 配下の `_test`、`_debug`、`_dev`、`_inspect` など |
| 実現方法 | `npm run check:dev-only-interface-policy` |
| OK条件 | reserved prefix が0件 |
| 証跡 | `dev-only-interface-policy.results.json` |
| 残リスク | ASTで関数定義だけを見る仕組みではなく、ファイル内容のpolicy check |

### 5.4 AIレビューJSONゲート

| 項目 | 内容 |
|---|---|
| check | `ai-review-result` |
| 観点 | AIレビュー結果をそのまま信用せず、表示前に最低限の品質を落とし込む |
| 入力 | `contracts/ai-review-result.contract.json`、`fixtures/ai-review-results/*.json` |
| 確認項目 | `reviews: []`、必須field、severity、`confidence >= 0.8`、`LOW` 除外、最大5件 |
| 実現方法 | `npm run check:ai-review-result` |
| OK条件 | `mixed-review-output` は4件中2件残る、`empty-review-output` は0件、`max-review-output` は6件中5件残る |
| 証跡 | `ai-review-result-gate.results.json` |
| 残リスク | 実AI API呼び出し、Structured Outputs API連携、GitHub投稿は未実装 |

### 5.5 依存方向

| 項目 | 内容 |
|---|---|
| check | `dependency-boundary` |
| 観点 | import関係が壊れていないか、循環依存がないか |
| 入力 | `external-tools/dependency-cruiser/dependency-boundary.tool.json`、`dependency-cruiser.config.cjs` |
| 確認項目 | `components -> api`、`components -> hooks`、`routes -> api`、`api -> ui`、循環依存 |
| 実現方法 | `npm run check:dependency-boundary` または `HARNESS_ENABLE_DEPENDENCY_BOUNDARY=1 npm run check` |
| OK条件 | dependency-cruiser の exit code が0 |
| 証跡 | `dependency-boundary.results.json` |
| 残リスク | 静的import解析なので、実行時の動的依存は対象外 |

### 5.6 要件とテストの対応

| 項目 | 内容 |
|---|---|
| check | `test-traceability` |
| 観点 | 要件source、JSON spec、tester moduleが対応しているか |
| 入力 | `test_management/manifest.json` |
| 確認項目 | manifest上の5 cases、requirement source存在、spec存在、tester module存在、野良spec検出 |
| 実現方法 | `npm run check:test-traceability` |
| OK条件 | 5 cases がすべて対応し、tester module assertion が通る |
| 証跡 | `test-traceability.results.json` |
| 残リスク | GitHub Issue APIの直接取得は未実装。現状は fixture まで |

### 5.7 TypeScript型

| 項目 | 内容 |
|---|---|
| check | `typecheck` |
| 観点 | TypeScriptの型エラーを残していないか |
| 入力 | `src/**/*.ts`、`src/**/*.tsx`、`tsconfig*.json` |
| 確認項目 | 型、import、JSX、tsconfig整合 |
| 実現方法 | `npm run typecheck` |
| OK条件 | `tsc --noEmit` の exit code が0 |
| 証跡 | `summary.md` の `typecheck: OK` |
| 残リスク | 実行時のAPI失敗やブラウザ操作は型だけでは分からない |

### 5.8 unit

| 項目 | 内容 |
|---|---|
| check | `unit` |
| 観点 | 小さいロジックの期待値が壊れていないか |
| 入力 | `src/**/*.test.*` |
| 確認項目 | 現在のunit 9 tests |
| 実現方法 | `npm run test:unit` |
| OK条件 | Vitest が全件pass |
| 証跡 | `summary.md` の `unit: OK` |
| 残リスク | UIクリックやAPI連携はunitだけでは確認しない |

### 5.9 API契約

| 項目 | 内容 |
|---|---|
| check | `api-contract` |
| 観点 | 保存データの形がAPIの前提とずれていないか |
| 入力 | `contracts/todos.contract.json`、`contracts/categories.contract.json`、`local-api/data/todos.json`、`local-api/data/categories.json` |
| 確認項目 | TODOと分類の必須field、unknown field禁止、`status` enum、`priority` enum、date-time |
| 実現方法 | `npm run check:api-contract` |
| OK条件 | `todos.json` と `categories.json` の全itemがcontractを満たす |
| 証跡 | `summary.md` の `api-contract: OK` |
| 残リスク | DB制約や認証付きAPIの契約は対象外 |

### 5.10 APIフロー

| 項目 | 内容 |
|---|---|
| check | `api-flow` |
| 観点 | APIがCRUD手順として実際に動くか |
| 入力 | `scenarios/todo-crud.scenario.json` |
| 確認項目 | `POST /categories`、`POST /todos`、`PATCH /todos/:id`、`PATCH /todos/:id/status`、`DELETE /todos/:id` |
| 実現方法 | `npm run check:api-flow` |
| OK条件 | 5 steps が期待statusとbody assertionを満たす |
| 証跡 | `summary.md` の `api-flow: OK` |
| 残リスク | 認証、競合更新、大量データ、ネットワーク遅延は未確認 |

### 5.11 静的a11y

| 項目 | 内容 |
|---|---|
| check | `static-a11y` |
| 観点 | UI source上の基本的なラベル、aria、状態表示が欠けていないか |
| 入力 | `policies/static-a11y.policy.json` |
| 確認項目 | label、aria、button文言、empty/loading/error表示などの文字列policy |
| 実現方法 | `npm run check:a11y-static` |
| OK条件 | policy違反が0件 |
| 証跡 | `summary.md` の `static-a11y: OK` |
| 残リスク | 実ブラウザ上のアクセシビリティツリーや操作性は別check |

### 5.12 build

| 項目 | 内容 |
|---|---|
| check | `build` |
| 観点 | production build が作れるか |
| 入力 | `src`、`vite.config.ts`、`tsconfig*.json` |
| 確認項目 | `tsc -b`、Vite build |
| 実現方法 | `npm run build` |
| OK条件 | build exit code が0で `dist` が生成される |
| 証跡 | `summary.md` の `build: OK` |
| 残リスク | deploy環境での実行は未確認 |

### 5.13 build成果物へのdev-only混入防止

| 項目 | 内容 |
|---|---|
| check | `dev-only-build-artifact-policy` |
| 観点 | build後の成果物へ開発専用文字列が混ざっていないか |
| 入力 | `policies/dev-only-build-artifact.policy.json`、`dist` |
| 確認項目 | `_test`、`_debug`、`_dev`、`_inspect` など |
| 実現方法 | `npm run check:dev-only-build-artifact-policy` |
| OK条件 | build後artifact内のreserved prefixが0件 |
| 証跡 | `dev-only-build-artifact-policy.results.json` |
| 残リスク | AST削除やbundle解析ではなく、文字列policy check |

### 5.14 実ブラウザE2E

| 項目 | 内容 |
|---|---|
| check | `browser-e2e` |
| 観点 | ユーザー操作としてTODOの主要操作が動くか |
| 入力 | `external-tools/playwright/browser-e2e.tool.json` |
| 確認項目 | create modal、category bar、category create、category color、category filter、search、detail inline toggle、edit modal、complete、completed list、delete、作成画面のfield meta表示、不要な `Quality Harness` 文言の非表示 |
| 実現方法 | `npm run check:browser-e2e` または `HARNESS_ENABLE_BROWSER_QUALITY=1 npm run check` |
| OK条件 | ChromiumのPlaywright testがpass |
| 証跡 | `browser-e2e.results.json` |
| 残リスク | Firefox、Safari、mobile実機は未確認 |

実行上の注意:

- 既存の古いサーバを再利用しないため、Playwright専用ポートを使う。
- APIのCORS許可元は `TODO_WEB_ORIGIN` でWebポートに合わせる。

### 5.15 実ブラウザa11y

| 項目 | 内容 |
|---|---|
| check | `browser-a11y` |
| 観点 | 実ブラウザ上で自動検出できるa11y違反がないか |
| 入力 | `external-tools/playwright/browser-a11y.tool.json` |
| 確認項目 | Chromium + axe-core。`color-contrast` は現状disabled |
| 実現方法 | `npm run check:browser-a11y` または `HARNESS_ENABLE_BROWSER_QUALITY=1 npm run check` |
| OK条件 | axe checkがpass |
| 証跡 | `browser-a11y.results.json` |
| 残リスク | color contrast、支援技術での手動確認、モバイル操作は未確認 |

### 5.16 pre-push/PR AI概念境界ゲート

| 項目 | 内容 |
|---|---|
| check | `pre-push-ai-concept-gate` |
| 観点 | 人間の語感、違和感、概念上のズレを、Harnessの機械判定と混ぜていないか |
| 入力 | ユーザー依頼、`git diff`、関連docs、実行結果、未解決メモ |
| 確認項目 | 概念境界、判定条件への変換、証跡、スコープ、次の行動 |
| 実現方法 | `docs/pre-push-ai-check-cheatsheet.md` をAIへ渡し、push/PR 前に差分を読んで `OK / NG / USER_CONFIRM` と理由を報告する |
| OK条件 | 人間の観察と機械判定が分かれ、Harness化するものは判定条件へ変換されている |
| 証跡 | `docs/pre-push-ai-concept-gate.md`、`docs/pre-push-ai-check-cheatsheet.md`、最終報告、必要なら `internal_refs/chat_logs/*` |
| 残リスク | 現時点では手動のAI判断。CIで自動実行する仕組みやJSON出力契約は未実装 |

## 6. optional check

通常の `npm run check` では、外部依存が重いものは環境変数で切り替える。

| check | 通常checkでの扱い | 有効化 |
|---|---|---|
| `dependency-boundary` | skip | `HARNESS_ENABLE_DEPENDENCY_BOUNDARY=1` |
| `browser-e2e` | skip | `HARNESS_ENABLE_BROWSER_QUALITY=1` |
| `browser-a11y` | skip | `HARNESS_ENABLE_BROWSER_QUALITY=1` |

専用profileでは環境変数なしで実行する。

- `npm run check:dependency-boundary`
- `npm run check:browser-quality`

## 7. 追加時のルール

新しいcheckを足す時は、次の順番で作る。

1. 目的を書く。
2. 入力形式を選ぶ。例: `contract.json`、`scenario.json`、`policy.json`、`tool.json`、`manifest.json`。
3. runner本体に個別pathを直書きしない。
4. 必要なら `profiles/*.json` に追加する。
5. この仕様書へ `観点 / 入力 / 確認項目 / 実現方法 / OK条件 / 証跡 / 残リスク` を追記する。
6. `npm run check:harness-genericity` と対象checkを実行する。
7. `docs/artifact-version-ledger.md` に証跡を残す。

固定値の扱い:

| 種類 | runnerに置いてよいか | 例 |
|---|---|---|
| 入力契約 | OK | `api-contract.v1`、`file-content-policy.v1` |
| 結果契約 | OK | `status: ok / failed`、result schema |
| 対象path | NG | `src/features/todos`、`local-api/data/todos.json` |
| 環境値 | NG | host、port、restore file |
| 外部tool詳細 | NG | Playwright CLI path、dependency-cruiser config path |

## 8. 現時点の未確認

| 未確認 | 理由 | 次にやるなら |
|---|---|---|
| Firefox、Safari、mobile実機 | Chromiumのみ確認済み | Playwright project追加、実機smoke追加 |
| 実AI API呼び出し | 現状は生成済みJSON fixtureの検査 | Structured Outputsで生成し、同じcontractへ通す |
| GitHub PR自動投稿 | 今は表示前フィルタまで | diff行マッピング、重複排除、posting payloadを別checkで設計する |
| 本番DB、認証、権限 | ローカルJSON APIの実験対象外 | DB contract、認証flow、権限matrixを追加する |
| 支援技術での手動a11y | 自動検出の範囲外 | keyboard、screen reader、色以外の状態伝達を別台帳で確認する |
