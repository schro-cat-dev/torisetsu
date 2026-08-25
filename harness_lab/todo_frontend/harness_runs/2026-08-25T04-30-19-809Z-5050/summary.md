# Quality Harness Summary

Run: 2026-08-25T04-30-19-809Z-5050
Profile: default
Description: TODO frontend の通常品質確認。型、unit、成果物バージョン、API契約、APIフロー、静的a11y、buildを順番に確認する。

| Check | Command | Result |
|---|---|---|
| `artifact-version` | `npm run check:artifact-version` | OK |
| `harness-genericity` | `npm run check:harness-genericity` | OK |
| `dev-only-interface-policy` | `npm run check:dev-only-interface-policy` | OK |
| `dependency-boundary` | `npm run check:dependencies` | SKIP |
| `test-traceability` | `npm run check:test-traceability` | OK |
| `typecheck` | `npm run typecheck` | OK |
| `unit` | `npm run test:unit` | OK |
| `api-contract` | `npm run check:api-contract` | OK |
| `api-flow` | `npm run check:api-flow` | OK |
| `static-a11y` | `npm run check:a11y-static` | OK |
| `build` | `npm run build` | OK |
| `dev-only-build-artifact-policy` | `npm run check:dev-only-build-artifact-policy` | OK |
| `browser-e2e` | `npm run check:browser-e2e` | SKIP |
| `browser-a11y` | `npm run check:browser-a11y` | SKIP |

## 残リスク

- Playwright と実ブラウザ a11y は HARNESS_ENABLE_BROWSER_QUALITY=1 のときだけ通常check内で実行する。
- dependency-cruiser は HARNESS_ENABLE_DEPENDENCY_BOUNDARY=1 のときだけ通常check内で実行する。
- API はローカル JSON 用の簡易実装。認証とDBは未実装。
