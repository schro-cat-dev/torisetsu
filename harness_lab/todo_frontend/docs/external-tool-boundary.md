# 外部ツール境界

このファイルは、品質ハーネスで外部ツールを使う時の信頼境界と切り替え方法をまとめる。

## 1. 方針

- 外部ツールの設定は `tooling/quality-harness/external-tools/` に隔離する。
- 外部ツールの実行処理は `checks/run-external-tool-spec.mjs` に集約する。
- 個別ツールのパス、引数、退避対象ファイル、結果ファイル名は `*.tool.json` に書く。
- `npx` で毎回外部から取得せず、`package-lock.json` に固定されたローカル依存だけを実行する。
- 通常の `npm run check` は軽く保ち、重い外部ツールはフラグで実行する。
- 専用profileでは、外部ツールだけを厳格実行できるようにする。

## 2. 固定値の線引き

| 種類 | runner本体 | 個別JSON |
|---|---|---|
| 入力契約 | 残す。例: `external-tool-check.v1` | 書く。例: `schemaVersion` |
| 結果契約 | 残す。例: `external-tool-check-result.v1` | 書く。例: `result.fileName` |
| tool path | 書かない | 書く。例: Playwright CLI path |
| test file path | 書かない | 書く。例: E2E test file path |
| restore file | 書かない | 書く。例: `local-api/data/todos.json` |

## 3. ツール

| ツール | 用途 | 実行コマンド | 通常check内のフラグ |
|---|---|---|---|
| `dependency-cruiser` | import境界と循環依存 | `npm run check:dependency-boundary` | `HARNESS_ENABLE_DEPENDENCY_BOUNDARY=1` |
| `Playwright` | 実ブラウザE2E | `npm run check:browser-quality` | `HARNESS_ENABLE_BROWSER_QUALITY=1` |
| `axe-core` | 実ブラウザa11y | `npm run check:browser-quality` | `HARNESS_ENABLE_BROWSER_QUALITY=1` |

## 4. 実行spec

| ファイル | 役割 |
|---|---|
| `dependency-cruiser/dependency-boundary.tool.json` | dependency-cruiser の config、target、結果ファイルを指定する |
| `playwright/browser-e2e.tool.json` | Playwright のE2E test file、退避する `todos.json`、結果ファイルを指定する |
| `playwright/browser-a11y.tool.json` | axe のa11y test file、退避する `todos.json`、結果ファイルを指定する |

## 5. 実行例

軽い通常確認:

```bash
npm run check
```

通常確認に依存境界チェックを足す:

```bash
HARNESS_ENABLE_DEPENDENCY_BOUNDARY=1 npm run check
```

通常確認にブラウザ確認を足す:

```bash
HARNESS_ENABLE_BROWSER_QUALITY=1 npm run check
```

外部ツールだけ確認:

```bash
npm run check:dependency-boundary
npm run check:browser-quality
```

## 6. 残リスク

- `dependency-cruiser` は静的importを見る。実行時の動的な依存までは見ない。
- Playwright は Chromium のみ確認する。Safari、Firefox、mobile実機は対象外。
- axe は自動検出できる範囲を見る。支援技術での手動確認は対象外。
