# Quality Harness Summary

Run: 2026-08-25T04-52-16-755Z-67167
Profile: default
Description: TODO frontend の通常品質確認。型、unit、AIレビューJSONゲート、API契約、APIフロー、静的a11y、buildを順番に確認する。

| Check | Command | Result |
|---|---|---|
| `artifact-version` | `npm run check:artifact-version` | OK |
| `harness-genericity` | `npm run check:harness-genericity` | OK |
| `dev-only-interface-policy` | `npm run check:dev-only-interface-policy` | OK |
| `ai-review-result` | `npm run check:ai-review-result` | OK |
| `dependency-boundary` | `npm run check:dependencies` | OK |
| `test-traceability` | `npm run check:test-traceability` | OK |
| `typecheck` | `npm run typecheck` | OK |
| `unit` | `npm run test:unit` | OK |
| `api-contract` | `npm run check:api-contract` | OK |
| `api-flow` | `npm run check:api-flow` | OK |
| `static-a11y` | `npm run check:a11y-static` | OK |
| `build` | `npm run build` | OK |
| `dev-only-build-artifact-policy` | `npm run check:dev-only-build-artifact-policy` | OK |
| `browser-e2e` | `npm run check:browser-e2e` | OK |
| `browser-a11y` | `npm run check:browser-a11y` | OK |

## 残リスク

- Playwright と実ブラウザ a11y は HARNESS_ENABLE_BROWSER_QUALITY=1 のときだけ通常check内で実行する。
- dependency-cruiser は HARNESS_ENABLE_DEPENDENCY_BOUNDARY=1 のときだけ通常check内で実行する。
- AIレビューJSONゲートは生成済みJSONの検査であり、実AI API呼び出しは対象外。
- API はローカル JSON 用の簡易実装。認証とDBは未実装。
