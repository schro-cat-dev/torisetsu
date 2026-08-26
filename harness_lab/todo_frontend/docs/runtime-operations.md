# runtime運用

このファイルは、TODO Quality Harness の起動、終了、cleanup、devログを確認するためのドキュメントです。

## 1. スコープ

- 対象: API、Web、起動、終了、status、pid、lock、devログ、エラーログ。
- 対象外: 品質ハーネス説明、UI設計、テスト観点。

## 2. コマンド

リポジトリルートから:

```bash
node runtime_scripts/todo_frontend_runtime.mjs start
node runtime_scripts/todo_frontend_runtime.mjs status
node runtime_scripts/todo_frontend_runtime.mjs stop
```

アプリディレクトリから:

```bash
npm run start:all
npm run status:all
npm run stop:all
```

## 3. 対応状況

| 観点 | 状態 | 実現方法 | 確認方法 |
|---|---|---|---|
| 1コマンド起動 | 対応済み | `runtime_scripts/todo_frontend_runtime.mjs start` | API と Web の health が `true` |
| 1コマンド終了 | 対応済み | `runtime_scripts/todo_frontend_runtime.mjs stop` | pid が停止し、pid / lock が消える |
| status | 対応済み | `runtime_scripts/todo_frontend_runtime.mjs status` | managed と health を表示 |
| cleanup | 対応済み | pid / lock を削除 | TODO保存データは削除しない |
| devログ | 対応済み | API が構造化ログを出す | `.runtime/logs/api.stdout.log` |
| エラーログ | 対応済み | API が error name / message / stack を出す | `.runtime/logs/api.stdout.log` |
| 未管理サービス検出 | 対応済み | 既に health が通るが pid 管理外なら start を失敗扱いにする | 古いプロセスの誤認を防ぐ |
| URL提示前のcleanup | 対応済み | `status` → 必要なら `stop` → `start` → `status` | 古いpidや古いサーバを見ていないことを確認する |

## 4. データ保護

- `stop` は `local-api/data/todos.json` を消さない。
- データ削除が必要な場合は、別途 `reset` 系コマンドとして分ける。
- 既に同じURLで別プロセスが動いている場合、`start` は成功扱いにしない。

## 5. ログ項目

APIログは次を出す。

```text
time / level / service / component / event / requestId / status / durationMs / error
```

ログの場所:

```text
harness_lab/todo_frontend/.runtime/logs/
```

## 6. URL提示前の手順

```bash
npm run status:all
npm run stop:all
npm run start:all
npm run status:all
```

確認すること:

- `api health=true`
- `web health=true`
- 権限付きで起動した場合は、同じ権限文脈で `status` と `curl` を確認する
- Web URL: `http://127.0.0.1:5173/todos`
- API health URL: `http://127.0.0.1:4174/api/health`
- `stop` で `local-api/data/*.json` は消さない
