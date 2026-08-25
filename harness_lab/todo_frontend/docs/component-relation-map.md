# コンポーネント関係マップ

このファイルは、UI、状態、API、保存、品質ハーネスの関係を辿るための管理ドキュメントです。

## 1. UI の包含関係

```mermaid
graph TD
  App --> BrowserRouter
  BrowserRouter --> Routes
  Routes --> TodoPage

  TodoPage --> TodoHeader
  TodoPage --> TodoCreateFormCreate["TodoCreateForm create"]
  TodoPage --> TodoToolbar
  TodoPage --> TodoListSection
  TodoPage --> TodoDetailPanel

  TodoListSection --> StatusView
  TodoListSection --> TodoList
  TodoList --> TodoListItem
  TodoDetailPanel --> TodoCreateFormEdit["TodoCreateForm edit"]
```

チェック:
- [x] `TodoPage` が主要 UI の親になっている。
- [x] `TodoListSection` が表示状態を切り替えている。
- [x] `TodoDetailPanel` が編集時に `TodoCreateForm` を再利用している。
- [ ] 作成用と編集用の `TodoCreateForm` 再利用が分かりやすいか確認する。

## 2. 状態とイベントの流れ

```mermaid
flowchart LR
  TodoCreateForm -->|onSubmit| TodoPage
  TodoToolbar -->|filter/sort/search change| TodoPage
  TodoListItem -->|onStatusChange| TodoPage
  TodoListItem -->|onDelete| TodoPage
  TodoDetailPanel -->|onSave/onCancel| TodoPage

  TodoPage --> useTodos
  useTodos --> todoApi
  todoApi --> LocalAPI["local-api/server.mjs"]
  LocalAPI --> todosJson["local-api/data/todos.json"]
```

チェック:
- [x] 小さい UI 部品は API を直接叩かない。
- [x] UI イベントは `TodoPage` 経由で `useTodos` へ渡る。
- [x] API 通信は `todoApi.ts` にまとまっている。
- [x] 保存先は `todos.json` に限定している。
- [ ] API エラー時の復旧導線を画面で確認する。

## 3. API と保存の関係

```mermaid
sequenceDiagram
  participant UI as React UI
  participant Hook as useTodos
  participant Client as todoApi.ts
  participant API as local-api/server.mjs
  participant JSON as todos.json

  UI->>Hook: create/update/delete/status event
  Hook->>Client: API function call
  Client->>API: HTTP request
  API->>JSON: read/write
  JSON-->>API: saved todos
  API-->>Client: JSON response
  Client-->>Hook: parsed result
  Hook-->>UI: state update
```

チェック:
- [x] `GET /api/todos` がある。
- [x] `POST /api/todos` がある。
- [x] `PATCH /api/todos/:id` がある。
- [x] `PATCH /api/todos/:id/status` がある。
- [x] `DELETE /api/todos/:id` がある。
- [x] `check-api-flow.mjs` で作成、更新、完了、削除を確認している。

## 4. 品質ハーネスの関係

```mermaid
flowchart TD
  RunCheck["npm run check"] --> Runner["run-quality-harness.mjs"]
  ApiOnly["npm run check:api-only"] --> Runner
  DepOnly["npm run check:dependency-boundary"] --> Runner
  BrowserOnly["npm run check:browser-quality"] --> Runner
  TraceOnly["npm run check:traceability"] --> Runner
  UiStatic["npm run check:ui-static"] --> Runner
  Runner --> Profile["profiles/*.json"]
  Profile --> DevOnly["npm run check:dev-only-interface-policy"]
  Profile --> AiReviewGate["npm run check:ai-review-result"]
  Profile --> DependencyBoundary["npm run check:dependencies"]
  Profile --> BrowserE2E["npm run check:browser-e2e"]
  Profile --> BrowserA11y["npm run check:browser-a11y"]
  Profile --> Traceability["npm run check:test-traceability"]
  Profile --> Typecheck["npm run typecheck"]
  Profile --> Unit["npm run test:unit"]
  Profile --> Contract["npm run check:api-contract"]
  Profile --> Flow["npm run check:api-flow"]
  Profile --> A11y["npm run check:a11y-static"]
  Profile --> Build["npm run build"]
  Build --> BuildArtifactGuard["npm run check:dev-only-build-artifact-policy"]
  Profile --> Genericity["npm run check:harness-genericity"]
  DependencyBoundary --> DepCruiser["dependency-cruiser"]
  BrowserE2E --> Playwright["Playwright"]
  BrowserA11y --> Axe["axe-core"]
  Contract --> CheckContract["checks/check-api-contract.mjs"]
  CheckContract --> ContractJson["contracts/*.json"]
  Flow --> CheckFlow["checks/check-api-flow.mjs"]
  CheckFlow --> ScenarioJson["scenarios/*.json"]
  AiReviewGate --> CheckAiReview["checks/check-ai-review-result.mjs"]
  CheckAiReview --> AiReviewContract["contracts/ai-review-result.contract.json"]
  CheckAiReview --> AiReviewFixtures["fixtures/ai-review-results/*.json"]
  A11y --> CheckA11y["checks/check-static-a11y.mjs"]
  DevOnly --> FilePolicyRunner["checks/run-file-content-policy.mjs"]
  BuildArtifactGuard --> FilePolicyRunner
  Genericity --> FilePolicyRunner
  FilePolicyRunner --> FilePolicies["policies/*.json"]
  Traceability --> Manifest["test_management/manifest.json"]
  Manifest --> Requirements["test_management/requirements/*.md"]
  Manifest --> Issues["test_management/issues/*.json"]
  Manifest --> GithubIssues["test_management/github_issues/*.json"]
  Manifest --> Specs["test_management/specs/*.json"]
  Specs --> TesterModules["test-runner/tester-modules/*.mjs"]
  Traceability --> TraceResult["test-traceability.results.json"]
  Runner --> Summary["harness_runs/*/summary.md"]
```

チェック:
- [x] 品質チェックを 1 コマンドで実行できる。
- [x] profile で実行セットを切り替えられる。
- [x] runner と個別チェックのファイル階層を分けている。
- [x] 要件source、JSON spec、tester moduleの関係を辿れる。
- [x] API contract と API flow の入力をJSONに分けている。
- [x] AIレビューJSONの最小契約と表示前フィルタを確認している。
- [x] import 依存方向チェックを外部ツール境界として分けている。
- [x] 実ブラウザ E2E / a11y を外部ツール境界として分けている。
- [x] 結果を `harness_runs/` に保存する。
- [x] API フロー確認はテスト後に `todos.json` を元に戻す。
- [x] Playwright による実ブラウザ確認を追加する。
- [x] 実ブラウザ a11y 確認を追加する。

## 5. 依存方向のルール

- UI は hook を呼んでよい。
- hook は API client を呼んでよい。
- API client は HTTP だけを扱う。
- local API は JSON 保存だけを扱う。
- 小さい UI コンポーネントは API client を直接呼ばない。

違反チェック:
- [x] `components/` から `todoApi.ts` を直接 import していない。
- [x] `TodoPage` だけが `useTodos` を呼んでいる。
- [x] 依存方向チェックを自動化する。
