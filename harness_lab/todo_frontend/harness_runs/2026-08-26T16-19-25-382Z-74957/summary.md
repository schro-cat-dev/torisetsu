# Quality Harness Summary

Run: 2026-08-26T16-19-25-382Z-74957
Profile: ui-static
Description: UI側の型、unit、静的a11y、buildだけを短く確認する。

| Check | Command | Result |
|---|---|---|
| `dev-only-interface-policy` | `npm run check:dev-only-interface-policy` | OK |
| `test-traceability` | `npm run check:test-traceability` | NG (1) |

## 残リスク

- API契約、APIフロー、実ブラウザ操作は対象外。
