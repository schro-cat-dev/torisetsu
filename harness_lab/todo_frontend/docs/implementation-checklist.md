# 実装チェックリスト

優先度とおすすめ度は 5 が高い。

## 1. 最小設計

- [x] 目的を固定する: TODO UI と品質確認ハーネスをローカルで試す。
- [x] 非ゴールを固定する: 認証、DB、Edge、デプロイ、本格 SaaS は入れない。
- [x] 保存方式を固定する: ローカル JSON + 小さい API。
- [x] UI 技術を固定する: React + Vite + React Router。
- [x] 品質確認を固定する: typecheck / unit / API 契約 / 静的 a11y / build。

## 2. 設計管理ドキュメント

- [x] UI コンポーネント単位の目的・背景・効果・定量条件を作る。
- [x] UI、状態、API、保存、品質ハーネスの関係図を作る。
- [x] UI、hook、API、ハーネスの汎用性レビューを作る。
- [x] 品質管理全体の入口ドキュメントを作る。
- [x] 成果物バージョン管理とフィードバック改善の入口を作る。
- [ ] 実ブラウザ確認後、未達条件を各管理ドキュメントへ反映する。

## 3. 成果物バージョン管理

- [x] `VERSION` を作る。
- [x] `package.json` の `version` と揃える。
- [x] `src/appVersion.ts` に画面参照用バージョンを置く。
- [x] `docs/artifact-versioning.md` に更新ルールを書く。
- [x] `docs/artifact-version-ledger.md` に現在バージョンを書く。
- [x] `docs/feedback-workstream.md` にフィードバック改善の流れを書く。
- [x] `npm run check` に `check:artifact-version` を追加する。
- [ ] フィードバック反映ごとに台帳を更新する。

## 4. データと API

- [x] `Todo` 型を作る。
- [x] `todos.json` を作る。
- [x] `GET /api/todos` を作る。
- [x] `POST /api/todos` を作る。
- [x] `PATCH /api/todos/:id` を作る。
- [x] `PATCH /api/todos/:id/status` を作る。
- [x] `DELETE /api/todos/:id` を作る。
- [x] API 契約チェックを作る。

## 5. UI

- [x] `TodoPage` を作る。
- [x] `TodoCreateForm` を作る。
- [x] `TodoToolbar` を作る。
- [x] `TodoListSection` を作る。
- [x] `TodoList` を作る。
- [x] `TodoListItem` を作る。
- [x] `TodoDetailPanel` を作る。
- [x] loading / error / empty / saving を出す。

## 6. 状態とイベント

- [x] `useTodos` に API 通信を集約する。
- [x] 小さい UI 部品は親へ event を渡す。
- [x] 作成、編集、削除、完了切替をつなぐ。
- [x] 検索、絞り込み、並び替えをつなぐ。

## 7. 品質ハーネス

- [x] unit test を作る。
- [x] API フロー確認を作る。
- [x] 静的 a11y チェックを作る。
- [x] `npm run check` で結果を `harness_runs/` に残す。
- [x] 成果物バージョン整合性チェックを作る。
- [x] 実行結果を確認する。
- [ ] 必要ならチェック項目を増やす。

## 8. 完了条件

- [x] `npm install` が通る。
- [x] `npm run check` が通る。
- [x] `npm run api` と `npm run dev` でローカル起動できる。
- [ ] 画面で TODO の作成、編集、削除、完了切替ができる。

補足:
- API の作成、更新、完了、削除は `npm run check` 内の API フロー確認で検証済み。
- 実ブラウザでの画面操作確認は、今回の環境では未実施。
