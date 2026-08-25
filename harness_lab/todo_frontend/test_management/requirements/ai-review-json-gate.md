# ai-review-json-gate

## 目的

AIレビュー結果を、PR自動投稿前の軽いJSONゲートとして安全に扱う。

## 完了条件

- `reviews: []` を有効な問題なし結果として扱う。
- `confidence >= 0.8` のものだけ残す。
- `severity: LOW` は表示対象から外す。
- 表示件数は最大5件にする。
- GitHub自動投稿はまだしない。
