# Quality Harness Summary

Run: 2026-08-26T17-18-15-385Z-39274
Profile: browser-quality
Description: 実ブラウザで主要操作とa11yを確認する。

| Check | Command | Result |
|---|---|---|
| `browser-e2e` | `npm run check:browser-e2e` | OK |
| `browser-a11y` | `npm run check:browser-a11y` | OK |

## 残リスク

- Chromiumだけを対象にする。Safari/Firefox/mobile実機は対象外。
- a11yはaxeの自動検出範囲であり、支援技術での手動確認は対象外。
