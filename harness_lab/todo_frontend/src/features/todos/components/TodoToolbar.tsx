import type { StatusFilter, TodoSortKey } from "../types";

type TodoToolbarProps = {
  searchText: string;
  statusFilter: StatusFilter;
  sortKey: TodoSortKey;
  onSearchTextChange: (value: string) => void;
  onStatusFilterChange: (value: StatusFilter) => void;
  onSortKeyChange: (value: TodoSortKey) => void;
  onReload: () => void;
};

export function TodoToolbar({
  searchText,
  statusFilter,
  sortKey,
  onSearchTextChange,
  onStatusFilterChange,
  onSortKeyChange,
  onReload
}: TodoToolbarProps) {
  return (
    <section className="toolbar" aria-label="TODOの検索と表示条件">
      <div className="field search-field">
        <label htmlFor="todo-search">検索</label>
        <input
          id="todo-search"
          value={searchText}
          placeholder="タイトルまたは説明で検索"
          onChange={(event) => onSearchTextChange(event.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="todo-status-filter">状態</label>
        <select
          id="todo-status-filter"
          value={statusFilter}
          onChange={(event) => onStatusFilterChange(event.target.value as StatusFilter)}
        >
          <option value="all">すべて</option>
          <option value="todo">未着手</option>
          <option value="doing">進行中</option>
          <option value="done">完了</option>
        </select>
      </div>

      <div className="field">
        <label htmlFor="todo-sort">並び順</label>
        <select
          id="todo-sort"
          value={sortKey}
          onChange={(event) => onSortKeyChange(event.target.value as TodoSortKey)}
        >
          <option value="createdDesc">新しい順</option>
          <option value="dueAsc">期限が近い順</option>
          <option value="priorityDesc">優先度が高い順</option>
        </select>
      </div>

      <button type="button" className="button secondary toolbar-button" onClick={onReload}>
        再読み込み
      </button>
    </section>
  );
}
