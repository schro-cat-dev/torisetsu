# 品質管理プラン

このファイルは、TODO アプリと品質ハーネスを一つずつ確認しながら進めるための管理ドキュメントです。

## 1. 品質管理の目的

- 実装が動くことだけでなく、なぜその UI や機構が必要かを確認する。
- UI、状態、API、保存、テスト、ハーネスの関係を辿れるようにする。
- 作業後に「何を確認済みか」「何が未確認か」が分かるようにする。

## 2. 管理ドキュメント

| ファイル | 役割 | 状態 |
|---|---|---|
| `implementation-checklist.md` | 実装作業の進捗 | 作成済み |
| `component-purpose-checklist.md` | UI ごとの目的、背景、効果、条件 | 作成済み |
| `component-relation-map.md` | UI、状態、API、保存、品質ハーネスの関係図 | 作成済み |
| `genericity-review.md` | UI、hook、API、ハーネスの汎用性評価 | 作成済み |
| `quality-management-plan.md` | 品質管理全体の入口 | このファイル |
| `artifact-versioning.md` | 成果物バージョン管理ルール | 作成済み |
| `artifact-version-ledger.md` | バージョンごとの変更、検証、残リスク | 作成済み |
| `feedback-workstream.md` | フィードバックを改善へつなげる流れ | 作成済み |
| `runtime-operations.md` | 起動、終了、cleanup、devログ | 作成済み |

## 3. 品質ゲート

### 3.1 設計ゲート

- [x] 目的が書かれている。
- [x] 非ゴールが書かれている。
- [x] 保存方式が決まっている。
- [x] UI コンポーネントごとの目的が書かれている。
- [x] UI コンポーネントごとの定性効果が書かれている。
- [x] UI コンポーネントごとの定量条件が書かれている。
- [x] Mermaid 図で関係を辿れる。
- [x] 汎用性評価がある。

### 3.2 実装ゲート

- [x] `TodoPage` が主要 UI を配置している。
- [x] `useTodos` が API 通信を集約している。
- [x] `todoApi.ts` が HTTP 通信をまとめている。
- [x] `server.mjs` が JSON 保存を扱う。
- [x] 小さい UI 部品が API を直接叩いていない。
- [ ] 実ブラウザで主要操作を確認する。

### 3.3 検証ゲート

- [x] `npm run typecheck` が通る。
- [x] `npm run test:unit` が通る。
- [x] `npm run check:api-contract` が通る。
- [x] `npm run check:api-flow` が通る。
- [x] `npm run check:a11y-static` が通る。
- [x] `npm run check:artifact-version` が通る。
- [x] `npm run build` が通る。
- [ ] Playwright で主要操作を確認する。
- [ ] axe などで実ブラウザ a11y を確認する。

### 3.4 バージョン管理ゲート

- [x] `VERSION` がある。
- [x] `package.json` の `version` と一致する。
- [x] `src/appVersion.ts` と一致する。
- [x] `artifact-version-ledger.md` に現在バージョンがある。
- [x] `npm run check` 内で `check:artifact-version` を実行する。
- [ ] フィードバック反映ごとに `artifact-version-ledger.md` を更新する。

### 3.5 runtime運用ゲート

- [x] 1つのスクリプトで API と Web をまとめて起動できる。
- [x] 同じスクリプトで `start` / `stop` / `status` を実行できる。
- [x] `stop` で pid / lock を cleanup する。
- [x] `stop` で TODO 保存データを消さない。
- [x] devログで API requestId、component、event、status、durationMs を確認できる。
- [x] エラー時に error name、message、stack を確認できる。
- [x] 未管理の既存サービスを起動成功扱いにしない。

## 4. 追加すべき品質チェック

優先度とおすすめ度は 5 が高い。

| 項目 | 種別 | 優先度 | おすすめ度 | 根拠 |
|---|---|---:|---:|---|
| 実ブラウザ E2E | 必須 | 5 | 5 | UI 操作の成功は現在 API フローでしか確認していない |
| 実ブラウザ a11y | 必須 | 5 | 5 | 静的文字列チェックだけでは不十分 |
| コンポーネントテスト | おすすめ | 4 | 4 | 入力エラーや disabled を小さく確認できる |
| 依存方向チェック | おすすめ | 4 | 4 | 小さい UI が API を直接叩かないルールを守りやすい |
| ハーネス設定の外出し | おすすめ | 3 | 4 | 別アプリへ流用しやすくなる |

## 5. 次の進め方

1. この管理ドキュメント群を読む。
2. 足りない項目があれば、先にチェックリストへ追加する。
3. 実装する。
4. `npm run check` を実行する。
5. 実行結果を `harness_runs/` で確認する。
6. 未確認項目を `implementation-checklist.md` とこのファイルに残す。

## 6. 今回の残リスク

- 実ブラウザでの操作確認が未実施。
- 静的 a11y は簡易チェックであり、実際の支援技術までは確認していない。
- 汎用性評価はドキュメント上の判断であり、別アプリへ転用して検証したわけではない。
- 内部バージョンはまだ Git commit や tag とは結びつけていない。
- runtime script は、このスクリプトが起動したプロセスだけを停止対象にする。
