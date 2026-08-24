import type { StatusFilter, Todo, TodoPriority, TodoSortKey } from "../types";

const priorityWeight: Record<TodoPriority, number> = {
  high: 3,
  medium: 2,
  low: 1
};

export function filterTodos(
  todos: Todo[],
  searchText: string,
  statusFilter: StatusFilter
): Todo[] {
  const normalizedSearch = searchText.trim().toLowerCase();

  return todos.filter((todo) => {
    const matchesStatus = statusFilter === "all" || todo.status === statusFilter;
    const matchesSearch =
      !normalizedSearch ||
      todo.title.toLowerCase().includes(normalizedSearch) ||
      todo.description.toLowerCase().includes(normalizedSearch);

    return matchesStatus && matchesSearch;
  });
}

export function sortTodos(todos: Todo[], sortKey: TodoSortKey): Todo[] {
  return [...todos].sort((a, b) => {
    if (sortKey === "dueAsc") {
      const aTime = a.dueDate ? Date.parse(a.dueDate) : Number.MAX_SAFE_INTEGER;
      const bTime = b.dueDate ? Date.parse(b.dueDate) : Number.MAX_SAFE_INTEGER;
      return aTime - bTime;
    }

    if (sortKey === "priorityDesc") {
      return priorityWeight[b.priority] - priorityWeight[a.priority];
    }

    return Date.parse(b.createdAt) - Date.parse(a.createdAt);
  });
}

export function getVisibleTodos(
  todos: Todo[],
  searchText: string,
  statusFilter: StatusFilter,
  sortKey: TodoSortKey
): Todo[] {
  return sortTodos(filterTodos(todos, searchText, statusFilter), sortKey);
}
