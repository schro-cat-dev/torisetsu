import type { StatusFilter, TodoSortKey, TodoViewMode } from "../types";

type TodoToolbarProps = {
  searchText: string;
  statusFilter: StatusFilter;
  sortKey: TodoSortKey;
  viewMode: TodoViewMode;
  onSearchTextChange: (value: string) => void;
  onStatusFilterChange: (value: StatusFilter) => void;
  onSortKeyChange: (value: TodoSortKey) => void;
};

export function TodoToolbar({
  searchText,
  statusFilter,
  sortKey,
  viewMode,
  onSearchTextChange,
  onStatusFilterChange,
  onSortKeyChange
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

      {viewMode === "active" ? (
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
          </select>
        </div>
      ) : null}

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
          <option value="priorityDueAsc">重要度が高い + 期限が近い順</option>
        </select>
      </div>
    </section>
  );
}
