# Quality Harness Summary

Run: 2026-08-26T15-33-02-137Z-49267
Profile: ui-static
Description: UI側の型、unit、静的a11y、buildだけを短く確認する。

| Check | Command | Result |
|---|---|---|
| `dev-only-interface-policy` | `npm run check:dev-only-interface-policy` | OK |
| `test-traceability` | `npm run check:test-traceability` | OK |
| `typecheck` | `npm run typecheck` | OK |
| `unit` | `npm run test:unit` | OK |
| `static-a11y` | `npm run check:a11y-static` | OK |
| `build` | `npm run build` | OK |
| `dev-only-build-artifact-policy` | `npm run check:dev-only-build-artifact-policy` | OK |

## 残リスク

- API契約、APIフロー、実ブラウザ操作は対象外。
