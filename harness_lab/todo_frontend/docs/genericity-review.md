# 汎用性レビュー

このファイルは、UI、hook、API、品質ハーネス、ツールの汎用性を確認するための管理ドキュメントです。

## 1. 判定基準

| 判定 | 意味 |
|---|---|
| 高 | TODO 以外にも少しの変更で使える |
| 中 | 考え方は使えるが、コードは一部変更が必要 |
| 低 | TODO 専用で、そのまま別用途には使いにくい |

## 2. UI コンポーネント

| 対象 | 汎用性 | 事実 | 次の改善 |
|---|---|---|---|
| `TodoHeader` | 中 | 件数表示と導線は他一覧でも使える | 名前を `ListHeader` に寄せる余地あり |
| `TodoCreateForm` | 低 | `TodoInput` に強く依存 | field 定義を外に出すと汎用化しやすい |
| `TodoToolbar` | 中 | 検索、状態、並び順は他一覧でも使える | option を props 化すると使い回せる |
| `TodoListSection` | 中 | loading/error/empty/list の考え方は汎用 | render props 化すると広がる |
| `TodoList` | 中 | 配列を item に渡すだけ | item renderer を渡す形なら汎用化できる |
| `TodoListItem` | 低 | TODO 表示と操作に強く依存 | 汎用化せず TODO 専用でよい |
| `TodoDetailPanel` | 低 | TODO 詳細と編集に依存 | detail 表示だけなら分離可能 |

チェック:
- [x] TODO 専用でよいものと、汎用化候補を分けた。
- [ ] 汎用化する対象を決める。
- [ ] 汎用化しない対象を明示する。

## 3. hook / API

| 対象 | 汎用性 | 事実 | 次の改善 |
|---|---|---|---|
| `useTodos` | 低 | TODO CRUD、filter、sort、saving を全部持つ | data hook と UI state hook を分ける |
| `todoApi.ts` | 低 | endpoint が TODO 専用 | request helper を共通化できる |
| `validation.ts` | 低 | TODO 入力ルール専用 | schema 形式へ寄せると汎用化しやすい |
| `todoFilters.ts` | 低 | TODO の status/priority に依存 | filter/sort 関数のテストは流用できる |

チェック:
- [x] 現状は TODO 専用寄りと判定した。
- [ ] `request<T>` を共通 API helper として切り出すか判断する。
- [ ] filter/sort の条件定義を外出しするか判断する。

## 4. ローカル API

| 対象 | 汎用性 | 事実 | 次の改善 |
|---|---|---|---|
| `server.mjs` | 低 | TODO endpoint と validation が直書き | route 定義を配列化すると広がる |
| `todos.json` | 低 | TODO データ専用 | data file path を設定化できる |

チェック:
- [x] 初回は TODO 専用の単純実装にした。
- [ ] route と validation を分けるか判断する。
- [ ] JSON 保存の安全性を強めるか判断する。

## 5. 品質ハーネス

| 対象 | 汎用性 | 事実 | 次の改善 |
|---|---|---|---|
| `run-quality-harness.mjs` | 中 | command 配列を順に実行して summary を出す | command 定義を JSON 化すると汎用化しやすい |
| `check-api-contract.mjs` | 低 | `todos.json` 専用 | schema input を外から渡せるようにする |
| `check-api-flow.mjs` | 低 | TODO CRUD 専用 | scenario 定義を外出しする |
| `check-static-a11y.mjs` | 低 | 文字列ベースの簡易確認 | axe / Playwright へ置き換える |
| `harness_runs/*/summary.md` | 高 | 実行結果の保存形式は汎用 | input / command / result / risk を増やす |

チェック:
- [x] ハーネスの汎用化候補を分けた。
- [ ] `run-quality-harness.mjs` の command 定義を外出しするか判断する。
- [ ] API contract / API flow を TODO 専用のままにするか判断する。
- [ ] Playwright 導入タイミングを決める。

## 6. 今回の方針

- 初回は「過剰な汎用化」をしない。
- ただし、汎用化できる場所とできない場所は明示する。
- 次に別アプリを作る場合、再利用できる候補は `run-quality-harness.mjs` と `harness_runs/summary.md`。

完了条件:
- [x] 汎用性の高・中・低を分類した。
- [x] 次の改善候補を出した。
- [ ] どれを実際に汎用化するか決める。
