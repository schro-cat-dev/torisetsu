# 成果物バージョン台帳

Current version: 0.2.0

## 0.2.0

日付: 2026-08-25

### 目的

- runtime側の未対応を対応済みにする。
- 1コマンド起動、終了、status、cleanup、devログ、エラーログをそろえる。

### 含まれるもの

- `runtime_scripts/todo_frontend_runtime.mjs` による `start` / `stop` / `status`。
- `stop` 時の pid / lock cleanup。
- TODO保存データ `local-api/data/todos.json` を消さない終了処理。
- API の requestId 付き構造化ログ。
- API のエラーログ `name` / `message` / `stack`。
- `docs/runtime-operations.md` による runtime 運用説明。

### 品質確認

- `node runtime_scripts/todo_frontend_runtime.mjs start`: OK。API と Web が `managed=true / health=true`。
- `node runtime_scripts/todo_frontend_runtime.mjs status`: OK。API と Web の状態を表示。
- `curl -H 'X-Request-Id: verify-runtime-log-001' http://127.0.0.1:4174/api/todos`: OK。APIログに requestId、storage read、durationMs を出力。
- 未管理API起動中の `node runtime_scripts/todo_frontend_runtime.mjs start`: OK。未管理サービスを検出し、成功扱いせず終了。
- `node runtime_scripts/todo_frontend_runtime.mjs stop`: OK。pid / lock を削除し、TODO保存データを保持。
- `npm run check`: OK。
- 最新確認: `harness_runs/2026-08-24T19-46-09-146Z/summary.md`。

### 残リスク

- 実ブラウザでの手動操作確認は未実施。
- runtime script は、このスクリプトが起動したプロセスだけを停止対象にする。

## 0.1.0

日付: 2026-08-25

### 目的

- TODO アプリを材料にして、品質確認ハーネスとツール連携を試す。
- ローカルだけで UI、API、JSON 保存、品質チェックを回せる状態にする。

### 含まれるもの

- React + Vite + React Router の TODO UI。
- Node 標準ライブラリのローカル API。
- `local-api/data/todos.json` による JSON 保存。
- 階層化した実装チェックリスト。
- UI 目的・効果チェックリスト。
- Mermaid による関係マップ。
- 汎用性レビュー。
- 品質管理プラン。
- `npm run check` による品質ハーネス。

### 品質確認

- `npm install`: OK。
- `npm run check`: OK。
- 最新確認: `harness_runs/2026-08-24T18-41-50-424Z/summary.md`。

### 残リスク

- 実ブラウザでの手動操作確認は未実施。
- Playwright E2E は未導入。
- 実ブラウザ a11y は未導入。
- API と品質チェックはまだ TODO 専用寄り。

### 次に見ること

- UI コンポーネント単位の目的と効果が画面上で成立しているか。
- ハーネス機構をどこまで汎用化するか。
- Playwright / axe を追加するか。
