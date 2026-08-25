# Quality Harness Summary

Run: 2026-08-25T03-37-58-775Z
Profile: default
Description: TODO frontend の通常品質確認。型、unit、成果物バージョン、API契約、APIフロー、静的a11y、buildを順番に確認する。

| Check | Command | Result |
|---|---|---|
| `artifact-version` | `npm run check:artifact-version` | OK |
| `dev-only-interface-policy` | `npm run check:dev-only-interface-policy` | OK |
| `test-traceability` | `npm run check:test-traceability` | OK |
| `typecheck` | `npm run typecheck` | OK |
| `unit` | `npm run test:unit` | OK |
| `api-contract` | `npm run check:api-contract` | OK |
| `api-flow` | `npm run check:api-flow` | OK |
| `static-a11y` | `npm run check:a11y-static` | OK |
| `build` | `npm run build` | OK |

## 残リスク

- Playwright と実ブラウザ a11y は初回対象外。
- API はローカル JSON 用の簡易実装。認証とDBは未実装。
