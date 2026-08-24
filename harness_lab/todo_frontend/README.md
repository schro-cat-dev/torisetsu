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
