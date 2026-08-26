# TODO設計タスクでのサンプル

## 入力

```text
TODOアプリを作りたい。
設計事故を減らし、AIに丸投げして負債が増えないようにしたい。
```

## ステート管理

```text
現在ステート:
設計相談

今回読むskill:
- chat-log-discipline: 会話ログを残すため
- alignment-gap-review: 提供価値、目的、対象、粒度、要素、観点のズレを見るため
- task-output-format-governance: 出力型を守るため

今回読まないskill:
- app-runtime-operations-governance: まだ起動、終了、loggerの話ではないため
- quality-harness-documentation-governance: まだ具体的な品質ハーネス説明の作成前のため
```

## ステップ

```text
1. 提供価値を見る
2. 目的を見る
3. 対象を見る
4. 前提を見る
5. 粒度を見る
6. 要素を見る
7. 観点を見る
8. 完了条件を見る
9. dry-runで、作るドキュメントと変更対象を出す
```

## ステップ内の分割例

`6. 要素を見る` をさらに分ける。

```text
6.1 UI要素
  - TodoPage
  - TodoCreateForm
  - TodoList
  - TodoListItem

6.2 状態要素
  - todos
  - selectedTodoId
  - isLoading
  - isSaving
  - errorMessage

6.3 API要素
  - GET /todos
  - POST /todos
  - PATCH /todos/:id
  - DELETE /todos/:id

6.4 保存要素
  - サーバーDB
  - IndexedDB下書き
  - localStorageは非機密UI設定だけ
```

## dry-run出力例

```text
本実行前の確認:

作るファイル:
- docs/todo-design.md
- docs/todo-quality-checklist.md

まだ作らないもの:
- 実装コード
- APIサーバー
- DB migration

理由:
まだ提供価値、対象、完了条件の確認ステートだから。

次へ進む条件:
- TODOアプリの提供価値が1文で書けている
- UI、状態、API、保存の要素が一覧化されている
- 完了条件が書けている
```

## NG例

```text
TODOアプリを作ります。
まずReactで実装します。
```

何が悪いか:

- 提供価値が未確認。
- 目的が未確認。
- skill順序がない。
- 相談ステートから実装ステートへ飛んでいる。
- dry-runがない。

## OK例

```text
現在ステート:
設計相談

結論:
まだ実装に入らず、TODO設計の要素と完了条件を先に確認します。

読むskill:
- alignment-gap-review
- task-output-format-governance

ステップ:
1. 提供価値
2. 対象
3. 粒度
4. 要素
5. 観点
6. 完了条件

次の一手:
TODOアプリの提供価値を1文で置き、UI、状態、API、保存の要素表を作ります。
```
