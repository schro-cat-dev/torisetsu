# Quality Harness Summary

Run: 2026-08-26T17-01-01-404Z-91067
Profile: browser-quality
Description: 実ブラウザで主要操作とa11yを確認する。

| Check | Command | Result |
|---|---|---|
| `browser-e2e` | `npm run check:browser-e2e` | NG (1) |

## 残リスク

- Chromiumだけを対象にする。Safari/Firefox/mobile実機は対象外。
- a11yはaxeの自動検出範囲であり、支援技術での手動確認は対象外。
