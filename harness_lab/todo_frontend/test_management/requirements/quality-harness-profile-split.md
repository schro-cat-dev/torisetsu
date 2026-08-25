# quality-harness-profile-split

## 目的

品質ハーネスを、実行器、実行セット、個別チェックに分ける。

## 完了条件

- `run-quality-harness.mjs` が `profiles/*.json` を読む。
- `check:api-only` と `check:ui-static` がある。
- 個別チェックは `checks/` 配下にある。
