# Quality Harness Summary

Run: 2026-08-25T03-31-33-534Z
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

## 残リスク

- API契約、APIフロー、実ブラウザ操作は対象外。
