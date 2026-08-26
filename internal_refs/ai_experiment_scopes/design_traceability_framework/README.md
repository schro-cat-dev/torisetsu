# 設計追跡フレームワーク

このドキュメントは、設計、実装、データの形、テスト、修正履歴を同じIDで辿るための草案です。

## 1. 結論

`ID対応表` を作る。

目的:

- AIや人間の記憶に頼らず、システム的に辿る。
- バグ修正箇所を間違えにくくする。
- 方針を決めたのに別の作業をしている、というズレを早く見つける。
- タスク依頼時に、最小の説明で対象を渡せるようにする。
- 設計、実装、型、テスト、ハーネス、git履歴を同じIDでつなぐ。

今回やること:

- `ID対応表` を正本にする。
- 検索インデックスは作らない。
- 必要なら `tags` や `kind` で軽く絞れるようにする。

## 2. なぜ必要か

バグ修正や設計変更では、次のズレが起きやすい。

| ズレ | 困ること | ID対応表でどう防ぐか |
|---|---|---|
| 直す場所を間違える | バグが残る、別のバグが増える | 修正対象IDに紐づくファイルだけを見る |
| 方針外の作業をする | 目的と違う差分が混ざる | 差分が修正対象IDと一致するか見る |
| テストが何を守るか不明 | 通っても安心できない | テストIDを設計IDへ紐づける |
| 型の参照先が曖昧 | 中間データの形がズレる | `X1-Y1-Y2` で型定義を一意に見る |
| 説明が長くなる | タスク依頼のトークン量が増える | IDだけで対象を渡せる |

一言で言うと、`後から思い出す` のではなく、`最初から辿れる形にしておく`。

## 3. 2階層で管理する

第1階層は、処理フローを特定するリスト。

第2階層は、その処理内で使うデータの形を特定するリスト。

```text
F1: TODO作成
  X1-Y1: APIからhandlerへ渡すデータの形
  X1-Y1-Y2: handlerからvalidatorへ渡すデータの形
  X1-Y1-Y2-Y3: validator後にcoreへ渡すデータの形
```

大事な区別:

| ID | 何を指すか | 何ではないか |
|---|---|---|
| `F1` | 処理フロー全体 | データの形ではない |
| `X1`, `Y1`, `Y2` | 処理の部品 | 型定義そのものではない |
| `X1-Y1-Y2` | データ型定義モデルの参照番号 | 実行時trace IDではない |
| `_test_X1-Y1-Y2_empty-title` | `X1-Y1-Y2` を確認するテスト | 汎用ログIDではない |

他ドキュメントへ写す時の注意:

- `F2` のようなIDは `flowId` として扱う。
- `X1-Y1-Y2` のようなIDは `typeModelRef` として扱う。
- `ID` とだけ書いてまとめない。
- 例: `flowId: F2 / typeModelRef: X1-Y1-Y2` のように役割名もセットで書く。

## 4. 人間が読む対応表

例: TODO作成

| 第1階層 | 処理名 | 目的 | kind | tags |
|---|---|---|---|---|
| `F1` | TODO作成 | 入力からTODOを作る | `create` | `todo`, `write`, `ui-api` |

| 第2階層 | from | to | データの形 | schema | test |
|---|---|---|---|---|---|
| `X1-Y1` | `X1` | `Y1` | API入力 | `contracts/X1-Y1.schema.json` | `_test_X1-Y1_required-title` |
| `X1-Y1-Y2` | `Y1` | `Y2` | validator前の入力 | `contracts/X1-Y1-Y2.schema.json` | `_test_X1-Y1-Y2_empty-title` |
| `X1-Y1-Y2-Y3` | `Y2` | `Y3` | validator後の入力 | `contracts/X1-Y1-Y2-Y3.schema.json` | `_test_X1-Y1-Y2-Y3_trimmed-title` |

## 5. 機械が読む対応表

正本はJSONやYAMLにする。Markdown表は人間が読むための写しにする。

最小例:

```json
{
  "schemaVersion": "design-traceability-map.v1",
  "flows": [
    {
      "flowId": "F1",
      "name": "create-todo",
      "kind": "create",
      "tags": ["todo", "write", "ui-api"],
      "routineOrder": ["X1", "Y1", "Y2", "Y3"],
      "allowedFiles": [
        "src/api/createTodoRoute.ts",
        "src/features/todos/createTodoHandler.ts",
        "src/features/todos/validateCreateTodo.ts",
        "src/features/todos/createTodoCore.ts"
      ],
      "typeModelRefs": ["X1-Y1", "X1-Y1-Y2", "X1-Y1-Y2-Y3"]
    }
  ],
  "typeModels": [
    {
      "ref": "X1-Y1",
      "from": "X1",
      "to": "Y1",
      "name": "CreateTodoHttpInput",
      "schema": "contracts/X1-Y1.create-todo-http-input.schema.json",
      "tests": ["_test_X1-Y1_required-title"]
    }
  ]
}
```

完全なサンプルは [todo-id-correspondence-map.json](samples/todo-id-correspondence-map.json) に置く。

`alignment-gap-review` と接続して、上位スコープ、処理フロー、`X1-Y1` 形式のデータ型定義モデル参照、複数観点チェックを同時に見る詳細設計は [alignment-gap-review-tool-design.md](alignment-gap-review-tool-design.md) に置く。

## 6. 修正時の使い方

バグ例:

```text
空タイトルでもTODOが作れてしまう。
```

修正対象:

```text
fixId: FIX-001
targetTypeModelRef: X1-Y1-Y2
expectedTest: _test_X1-Y1-Y2_empty-title
```

この時に触ってよいもの:

```text
src/features/todos/validateCreateTodo.ts
contracts/X1-Y1-Y2.create-todo-raw-input.schema.json
tests/_test_X1-Y1-Y2_empty-title.test.ts
```

触ったら警告したいもの:

```text
src/features/todos/deleteTodo.ts
src/routes/settings.tsx
README.md
```

理由:

- 今回の修正対象IDと関係が薄い。
- 方針外の作業が混ざっている可能性がある。

## 7. ハーネスで確認すること

| 確認 | OK条件 | NG例 |
|---|---|---|
| ID重複 | `flowId`、`ref`、`testId` が重複しない | `X1-Y1-Y2` が2件ある |
| 参照先 | `typeModelRef` が `typeModels` に存在する | `X1-Y1-Y9` がない |
| schema | schemaファイルが存在する | `contracts/X1-Y1.schema.json` がない |
| test | 対応テストが存在する | `_test_X1-Y1-Y2_empty-title` がない |
| 差分範囲 | 変更ファイルが `allowedFiles` 内にある | unrelated fileを変更 |
| 修正対象 | `fixTargets.targetRefs` と差分が対応している | `FIX-001` なのに別flowを変更 |
| 結果 | 対象テストがOK | 対象テストが失敗 |

## 8. TDDの流れ

TDDは、先に期待する動きをテストに書いてから実装する進め方。

このフレームワークでは、次の順で進める。

1. `fixId` を作る。
2. `targetTypeModelRef` を決める。
3. 対応する `_test_...` を作る。
4. まずテストを失敗させる。
5. 修正対象IDに関係するファイルだけ直す。
6. テストを通す。
7. 差分が修正対象IDと合っているか見る。
8. 結果を履歴に残す。

例:

```text
FIX-001
対象: X1-Y1-Y2
テスト: _test_X1-Y1-Y2_empty-title
期待: title が空なら保存できない
```

## 9. git/GitHub履歴とのつなぎ方

最初はGitHub API連携まで作らなくてよい。まずはgit commit情報とID対応表をつなぐ。

履歴例:

```json
{
  "fixId": "FIX-001",
  "targetRefs": ["X1-Y1-Y2"],
  "commit": "abc1234",
  "changedFiles": [
    "src/features/todos/validateCreateTodo.ts",
    "tests/_test_X1-Y1-Y2_empty-title.test.ts"
  ],
  "behaviorChange": "空titleを保存できないようにした",
  "tests": [
    {
      "id": "_test_X1-Y1-Y2_empty-title",
      "result": "ok"
    }
  ],
  "fixedBy": "user-or-ai",
  "fixedAt": "2026-08-26T00:00:00Z"
}
```

これで、後から次を辿れる。

- どのIDを直したか。
- どのファイルを触ったか。
- どのテストが通ったか。
- 挙動がどう変わったか。
- いつ、誰が直したか。

## 10. 検索インデックスは今は作らない

今は検索インデックスを作らない。

理由:

- まずはID対応表だけで価値を確認できる。
- 今の規模ならJSONとgrepで足りる。
- 先に検索基盤を作ると、設計の芯より周辺実装が増える。

代わりに、軽い絞り込み用の情報だけ置く。

```json
{
  "kind": "create",
  "tags": ["todo", "write", "validation"],
  "coreLevel": "core-adjacent"
}
```

検索インデックスを検討する条件:

- ID対応表の読み込みが遅い。
- grepやJSON scanで探す時間が長い。
- 複数repoや大量の履歴を横断する。
- 数百万行規模で、人間が追う時間が明確に増えた。

## 11. 最初に作るもの

優先度は5が高い。ここでの優先度は `設計、実装、テスト、修正を決定論的に辿れるか` の視点で見る。

| 作るもの | 優先度 | おすすめ度 | 理由 |
|---|---:|---:|---|
| ID対応表 | 5 | 5 | すべての参照の芯になる |
| type model refs | 5 | 5 | データの形を一意に見られる |
| test map | 5 | 5 | どのテストが何を守るか分かる |
| fix target map | 5 | 5 | 修正対象外の差分を見つけられる |
| harness check | 5 | 5 | 手作業ではなく機械で確認できる |
| git履歴の記録 | 3 | 4 | 最初は手動でもよいが、後で効く |
| 検索インデックス | 2 | 2 | 今は不要。規模が増えたら検討 |

## 12. 完了条件

この仕組みの最小完了条件:

- [ ] `flowId` がある。
- [ ] `typeModelRef` がある。
- [ ] `typeModelRef` にschemaがある。
- [ ] `typeModelRef` にtestがある。
- [ ] 修正対象IDと変更ファイルを照合できる。
- [ ] 失敗したtest IDから、直す候補を辿れる。
- [ ] 実行結果とcommit履歴を残せる。

## 13. 今後作るscript案

まだ実装しないが、作るなら次の分離がよい。

```text
tooling/design-trace/
  runners/
    check-design-trace-map.mjs
    check-fix-target-diff.mjs
    record-fix-evidence.mjs
  maps/
    todo-id-correspondence-map.json
```

scriptの役割:

| script | 役割 |
|---|---|
| `check-design-trace-map.mjs` | ID、schema、testの参照が揃っているか見る |
| `check-fix-target-diff.mjs` | 差分が修正対象IDと合っているか見る |
| `record-fix-evidence.mjs` | commit、テスト結果、挙動変化を履歴に残す |

## 14. 注意

- `X1-Y1-Y2` は、実行経路IDではない。
- `X1-Y1-Y2` は、データ型定義モデルの参照番号。
- trace ID、ログID、commit IDとは分ける。
- 検索インデックスは今は作らない。
- AIや人間の感覚ではなく、ID対応表とハーネス結果を正本にする。
