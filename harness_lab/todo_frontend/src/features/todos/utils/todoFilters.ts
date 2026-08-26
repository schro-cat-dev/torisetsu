import type { CategoryFilter, StatusFilter, Todo, TodoPriority, TodoSortKey, TodoViewMode } from "../types";

const priorityWeight: Record<TodoPriority, number> = {
  high: 3,
  medium: 2,
  low: 1
};

export function filterTodos(
  todos: Todo[],
  searchText: string,
  statusFilter: StatusFilter,
  categoryFilter: CategoryFilter
): Todo[] {
  const normalizedSearch = searchText.trim().toLowerCase();

  return todos.filter((todo) => {
    const matchesStatus = statusFilter === "all" || todo.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || todo.categoryId === categoryFilter;
    const matchesSearch =
      !normalizedSearch ||
      todo.title.toLowerCase().includes(normalizedSearch) ||
      todo.description.toLowerCase().includes(normalizedSearch);

    return matchesStatus && matchesCategory && matchesSearch;
  });
}

export function sortTodos(todos: Todo[], sortKey: TodoSortKey): Todo[] {
  return [...todos].sort((a, b) => {
    const dueDiff = dueTime(a) - dueTime(b);

    if (sortKey === "dueAsc") {
      return dueDiff;
    }

    if (sortKey === "priorityDesc") {
      return priorityWeight[b.priority] - priorityWeight[a.priority];
    }

    if (sortKey === "priorityDueAsc") {
      const priorityDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
      return priorityDiff || dueDiff || Date.parse(b.createdAt) - Date.parse(a.createdAt);
    }

    return Date.parse(b.createdAt) - Date.parse(a.createdAt);
  });
}

export function getVisibleTodos(
  todos: Todo[],
  searchText: string,
  statusFilter: StatusFilter,
  categoryFilter: CategoryFilter,
  sortKey: TodoSortKey
): Todo[] {
  return sortTodos(filterTodos(todos, searchText, statusFilter, categoryFilter), sortKey);
}

export function filterTodosByViewMode(todos: Todo[], viewMode: TodoViewMode): Todo[] {
  return todos.filter((todo) => (viewMode === "completed" ? todo.status === "done" : todo.status !== "done"));
}

export function sortCompletedTodos(todos: Todo[]): Todo[] {
  return [...todos].sort((a, b) => completedTime(b) - completedTime(a));
}

function dueTime(todo: Todo): number {
  return todo.dueDate ? Date.parse(todo.dueDate) : Number.MAX_SAFE_INTEGER;
}

function completedTime(todo: Todo): number {
  return Date.parse(todo.completedAt || todo.updatedAt || todo.createdAt);
}
