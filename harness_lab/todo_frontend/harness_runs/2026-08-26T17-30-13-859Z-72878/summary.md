# Quality Harness Summary

Run: 2026-08-26T17-30-13-859Z-72878
Profile: dependency-boundary
Description: src の import 境界と循環依存だけを確認する。

| Check | Command | Result |
|---|---|---|
| `dependency-boundary` | `npm run check:dependencies` | OK |

## 残リスク

- dependency-cruiser はJS/TS importの静的解析であり、実行時の動的importやブラウザ操作は対象外。
