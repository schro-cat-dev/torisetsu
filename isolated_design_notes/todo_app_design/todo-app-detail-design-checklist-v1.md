# TODOアプリ詳細設計チェックリスト v1

このファイルは、他の作業や通常ドキュメントから切り離して保管する隔離メモです。

注意:
- この v1 は、2026-08-23 時点の仮案です。
- `保存と同期` と `UXチェック` は、後続の見直し対象です。
- 見直し内容は `secure-by-design-and-ux-review-notes.md` に分けて保存します。

## 前提

CRUD = 作成 / 表示 / 更新 / 削除 ができる TODO アプリ。

## 1. 全体方針

- API 通信は `TodoPage` または `useTodos` に集約する。
- 小さい UI 部品は API を直接叩かない。
- 小さい UI 部品は `クリックされた`、`入力された` を親に伝える。
- 親が state、API、保存、同期を管理する。

## 2. 画面とルート

| ルート | 画面 | 役割 |
|---|---|---|
| `/todos` | 一覧画面 | TODO 一覧、作成、検索、絞り込み |
| `/todos/new` | 新規作成画面 | 作成専用にする場合 |
| `/todos/:id` | 詳細画面 | 1 件の詳細表示 |
| `/todos/:id/edit` | 編集画面 | 編集専用にする場合 |

## 3. データ

```ts
Todo = {
  id,
  title,
  description,
  status,      // todo / doing / done
  priority,    // low / medium / high
  dueDate,
  createdAt,
  updatedAt
}
```

画面が持つ値:

```ts
TodoUiState = {
  todos,
  selectedTodoId,
  searchText,
  statusFilter,
  sortKey,
  isLoading,
  isSaving,
  errorMessage
}
```

フォームが持つ値:

```ts
TodoFormState = {
  titleInput,
  descriptionInput,
  selectedPriority,
  selectedDueDate,
  validationErrors
}
```

## 4. UI の包含関係

```text
TodoPage
├─ TodoHeader
├─ TodoCreateForm
│  ├─ TitleInput
│  ├─ DescriptionInput
│  ├─ PrioritySelect
│  ├─ DueDateInput
│  ├─ ValidationMessage
│  └─ SubmitButton
├─ TodoToolbar
│  ├─ SearchInput
│  ├─ StatusFilterTabs
│  └─ SortSelect
├─ TodoListSection
│  ├─ LoadingView
│  ├─ ErrorView
│  ├─ EmptyView
│  └─ TodoList
│     └─ TodoListItem
│        ├─ TodoCheckbox
│        ├─ TodoTitle
│        ├─ TodoMeta
│        ├─ TodoEditButton
│        └─ TodoDeleteButton
└─ TodoDetailPanel
```

認識:
- ファイルや責任は独立。
- 見た目の領域は親子の包含関係あり。
- API を叩くのは主に `TodoPage` / `useTodos`。
- `TodoListItem` や `SubmitButton` はイベントを親に渡す。

## 5. コンポーネント責任

| UI | 持つ情報 | 呼ぶ処理 |
|---|---|---|
| `TodoPage` | todos, loading, error, filter | `loadTodos`, `createTodo`, `updateTodo`, `deleteTodo` |
| `TodoCreateForm` | 入力値、入力エラー | `validateCreateForm`, `handleCreateSubmit` |
| `TitleInput` | title 入力 | `handleTitleChange` |
| `DescriptionInput` | description 入力 | `handleDescriptionChange` |
| `PrioritySelect` | priority 選択 | `handlePriorityChange` |
| `DueDateInput` | dueDate 選択 | `handleDueDateChange` |
| `TodoToolbar` | 検索、絞り込み、並び替え | `filterTodos`, `sortTodos` |
| `TodoListSection` | loading/error/empty の出し分け | `loadTodos` |
| `TodoList` | 表示用 todos | `getVisibleTodos` |
| `TodoListItem` | 1 件の todo | 完了、編集、削除イベント |
| `TodoDetailPanel` | 選択中 todo、編集値 | `handleEditSave`, `handleEditCancel` |

## 6. メソッドと API 対応

| メソッド | UI | API |
|---|---|---|
| `loadTodos()` | `TodoPage` | `GET /todos` |
| `handleTitleChange(value)` | `TitleInput` | なし |
| `handleDescriptionChange(value)` | `DescriptionInput` | なし |
| `handlePriorityChange(value)` | `PrioritySelect` | なし |
| `handleDueDateChange(value)` | `DueDateInput` | なし |
| `validateCreateForm()` | `TodoCreateForm` | なし |
| `handleCreateSubmit()` | `TodoCreateForm` | `POST /todos` |
| `resetCreateForm()` | `TodoCreateForm` | なし |
| `filterTodos(todos, filter)` | `TodoToolbar` | なし |
| `sortTodos(todos, sortKey)` | `TodoToolbar` | なし |
| `getVisibleTodos()` | `TodoPage` | なし |
| `handleEditStart(todoId)` | `TodoEditButton` | なし |
| `handleEditCancel()` | `TodoDetailPanel` | なし |
| `handleEditSave(todoId, input)` | `TodoDetailPanel` | `PATCH /todos/:id` |
| `toggleTodoStatus(todoId)` | `TodoCheckbox` | `PATCH /todos/:id/status` |
| `confirmDelete(todoId)` | `TodoDeleteButton` | なし |
| `handleDelete(todoId)` | `TodoDeleteButton` | `DELETE /todos/:id` |
| `persistTodos(todos)` | `useTodos` | なし |
| `restoreTodos()` | `useTodos` | なし |
| `syncTodos()` | `useTodos` | `GET/POST/PATCH/DELETE` |

## 7. イベントの流れ

作成:

```text
入力 -> state更新 -> 保存ボタン -> 入力チェック -> POST /todos -> todos更新 -> ローカル保存
```

完了切替:

```text
チェック -> 画面を先に更新 -> PATCH /todos/:id/status -> 失敗したら元に戻す
```

編集:

```text
編集開始 -> 入力変更 -> 保存 -> PATCH /todos/:id -> todos更新 -> 詳細表示へ戻す
```

削除:

```text
削除クリック -> 確認 -> DELETE /todos/:id -> 一覧から削除 -> ローカル保存
```

## 8. 保存と同期

- API あり: サーバーを正とする。
- localStorage: 軽い一時保存向き。
- IndexedDB: 件数が多い、オフライン対応向き。
- 保存タイミング:
  - 作成成功後。
  - 更新成功後。
  - 削除成功後。
  - オフライン時は一時保存して後で `syncTodos()`。

## 9. UX チェック

- 保存中はボタンを押せない。
- 空入力は保存できない。
- API 失敗時に理由を表示する。
- 一覧 0 件時は `EmptyView`。
- 読み込み中は `LoadingView`。
- 長いタイトルで崩れない。
- スマホでも押しやすい。
- 検索、絞り込み、並び替えが同時に効く。

## 10. 実装順

1. `Todo` 型を作る。
2. API 関数を作る。
3. `useTodos` で取得・作成・更新・削除をまとめる。
4. `TodoPage` で state を持つ。
5. `TodoCreateForm` を作る。
6. `TodoListSection` / `TodoList` / `TodoListItem` を作る。
7. 完了切替、編集、削除をつなぐ。
8. 検索、絞り込み、並び替えを足す。
9. localStorage / IndexedDB 保存を足す。
10. loading / error / empty を整える。
11. スマホ表示と操作を確認する。
