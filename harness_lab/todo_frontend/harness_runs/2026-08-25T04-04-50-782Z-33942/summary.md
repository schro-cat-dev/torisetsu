# Quality Harness Summary

Run: 2026-08-25T04-04-50-782Z-33942
Profile: api-only
Description: ローカルAPIの契約とCRUDフローだけを短く確認する。

| Check | Command | Result |
|---|---|---|
| `api-contract` | `npm run check:api-contract` | OK |
| `api-flow` | `npm run check:api-flow` | OK |

## 残リスク

- UI表示、build、実ブラウザ操作は対象外。
