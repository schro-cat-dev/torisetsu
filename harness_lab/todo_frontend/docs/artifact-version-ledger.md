# 成果物バージョン台帳

Current version: 0.1.0

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
