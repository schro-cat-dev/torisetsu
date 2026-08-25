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
| `run-quality-harness.mjs` | 高 | `profiles/*.json` を読んで順に実行し、summary を出す | profile の schema 確認を強める |
| `profiles/*.json` | 高 | 実行セットを runner から分離している | profile の用途と対象範囲を増やす |
| `checks/check-api-contract.mjs` | 高 | `contracts/*.json` を読んで対象ファイルとfield条件を確認する | 対応typeとformatを増やす |
| `contracts/*.json` | 高 | API contractをデータとして差し替えられる | JSON Schema互換に寄せるか判断する |
| `checks/check-api-flow.mjs` | 高 | `scenarios/*.json` のstepsを実行する | 認証や複数サーバーscenarioを足す |
| `scenarios/*.json` | 高 | API flowをデータとして差し替えられる | 変数、JSON path、期待値の種類を増やす |
| `checks/check-ai-review-result.mjs` | 高 | AIレビューJSONをcontractとfixtureで検査する | 実AI APIの出力保存と接続する |
| `contracts/ai-review-result.contract.json` | 高 | 必須field、severity、しきい値、最大件数をデータ化している | JSON Schema互換に寄せるか判断する |
| `fixtures/ai-review-results/*.json` | 高 | 正常、空配列、最大件数をfixtureで確認する | invalid fixtureを追加する |
| `checks/check-static-a11y.mjs` | 低 | 文字列ベースの簡易確認 | axe / Playwright へ置き換える |
| `checks/run-external-tool-spec.mjs` | 高 | `external-tool-check.v1` の JSON spec を読み、外部ツールを共通実行する | timeoutや環境変数の契約を増やす |
| `external-tools/*/*.tool.json` | 高 | dependency-cruiser、Playwright、axe の実行内容をデータとして分離 | 別アプリ用のspecを追加する |
| `checks/check-test-traceability.mjs` | 高 | manifest、要件source、JSON spec、tester moduleを共通処理でつなぐ | 外部API adapterを足す |
| `test-runner/tester-modules/*.mjs` | 中 | metadataとvalidateInputを持つ判定module | TypeScript化するか判断する |
| `policies/harness-genericity.policy.json` | 高 | runner配下の個別path直書きを機械検出する | 禁止値を増やす |
| `test_management/requirements/*.md` | 中 | md型の要件source | issueや外部sourceと同じ内部表現へ寄せる |
| `test_management/issues/*.json` | 中 | issue型の要件sourceをローカルで表現している | GitHub Issue API adapterを追加する |
| `test_management/github_issues/*.json` | 中 | GitHub Issue相当のfixtureを表現している | GitHub API取得を追加する |
| `test_management/specs/*.json` | 高 | 個別条件をJSONに分離している | 実ブラウザ操作specを追加する |
| `harness_runs/*/summary.md` | 高 | 実行結果の保存形式は汎用 | input / command / result / risk を増やす |
| `external-tools/*` | 高 | 外部ツールの設定と実行specをアプリ本体から分離している | ツールごとの信頼境界テンプレートにする |

チェック:
- [x] ハーネスの汎用化候補を分けた。
- [x] `run-quality-harness.mjs` の command 定義を profile JSON に外出しした。
- [x] テスト実行moduleとJSON specを分離した。
- [x] 要件sourceを md と issue-file に分けられる形にした。
- [x] API contract を schema入力化した。
- [x] API flow を scenario JSON化した。
- [x] AIレビューJSONの最小契約と表示前フィルタを追加した。
- [x] build後の dev-only 文字列scanを追加した。
- [x] dependency-cruiser による依存方向チェックを追加した。
- [x] Playwright による実ブラウザE2Eを追加した。
- [x] axe による実ブラウザa11yを追加した。
- [x] 汎用runner本体の個別path直書きを `harness-genericity` で確認する。

## 6. 今回の方針

- 初回は「過剰な汎用化」をしない。
- ただし、汎用化できる場所とできない場所は明示する。
- 次に別アプリを作る場合、再利用できる候補は `run-quality-harness.mjs`、`profiles/*.json`、`contracts/*.json`、`scenarios/*.json`、`check-test-traceability.mjs`、`test-runner/tester-modules/`、`harness_runs/summary.md`。

完了条件:
- [x] 汎用性の高・中・低を分類した。
- [x] 次の改善候補を出した。
- [x] runner と実行セットを先に汎用化した。
