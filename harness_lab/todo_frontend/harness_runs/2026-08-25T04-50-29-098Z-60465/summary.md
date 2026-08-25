# Quality Harness Summary

Run: 2026-08-25T04-50-29-098Z-60465
Profile: ai-review-output
Description: AIレビューJSONの最小契約と表示前フィルタだけを確認する。

| Check | Command | Result |
|---|---|---|
| `ai-review-result` | `npm run check:ai-review-result` | OK |

## 残リスク

- Structured Outputsで実際にAIから生成する処理は対象外。
- GitHub PRへのinline自動投稿は対象外。
