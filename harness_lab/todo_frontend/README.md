# TODO Quality Harness

ローカルだけで動く、TODO アプリ + 品質確認ハーネスです。

## 目的

- 小さいフロントエンドを実装する。
- JSON 保存のローカル API と接続する。
- 品質チェックを 1 コマンドで回せるようにする。
- 実行結果を `harness_runs/` に残す。

## 起動

リポジトリルートから:

```bash
node runtime_scripts/todo_frontend_runtime.mjs start
node runtime_scripts/todo_frontend_runtime.mjs status
node runtime_scripts/todo_frontend_runtime.mjs stop
```

TODO データは `stop` しても消えません。

アプリディレクトリから:

```bash
npm install
npm run start:all
npm run status:all
npm run stop:all
```

画面:

```text
http://127.0.0.1:5173/todos
```

API:

```text
http://127.0.0.1:4174/api/todos
```

## 確認

```bash
npm run check
```

用途を絞って確認する場合:

```bash
npm run check:api-only
npm run check:dependency-boundary
npm run check:browser-quality
npm run check:ai-review-output
npm run check:harness-genericity
npm run check:traceability
npm run check:ui-static
```

通常の `npm run check` に外部ツールを足す場合:

```bash
HARNESS_ENABLE_DEPENDENCY_BOUNDARY=1 npm run check
HARNESS_ENABLE_BROWSER_QUALITY=1 npm run check
```

品質ハーネスの構成:

- `docs/quality-harness-spec.md`: 何を、どの入力で、どう確認し、何をOKとするかの仕様書。
- `tooling/quality-harness/run-quality-harness.mjs`: profile を読んで順番に実行する本体。
- `tooling/quality-harness/profiles/*.json`: 何を確認するかの実行セット。
- `tooling/quality-harness/checks/*.mjs`: 個別チェック。
- `tooling/quality-harness/contracts/*.json`: API contract の入力データ。
- `tooling/quality-harness/scenarios/*.json`: API flow の入力データ。
- `tooling/quality-harness/fixtures/`: 品質ゲート用の入力サンプル。
- `tooling/quality-harness/external-tools/`: dependency-cruiser、Playwright、axe の隔離設定。
- `test_management/`: 要件sourceとJSON specの1対1対応。

## devログ

- APIログ: `harness_lab/todo_frontend/.runtime/logs/api.stdout.log`
- Webログ: `harness_lab/todo_frontend/.runtime/logs/web.stdout.log`
- エラーログ: `harness_lab/todo_frontend/.runtime/logs/*.stderr.log`
- APIログには `time / level / service / component / event / requestId / status / durationMs / error` を出す。

## バージョン

- 現在版は `VERSION` で管理する。
- 画面表示用の版は `src/appVersion.ts` に置く。
- 変更履歴と検証結果は `docs/artifact-version-ledger.md` に残す。
- 整合性だけ確認する場合は `npm run check:artifact-version` を使う。

## 保存方式

- TODO 本体は `local-api/data/todos.json` に保存する。
- `localStorage` は TODO 本体には使わない。
- DB、認証、Edge、デプロイは初回の対象外。
