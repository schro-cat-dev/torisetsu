import type { Todo, TodoCategory, TodoStatus } from "../types";

const statusLabels: Record<TodoStatus, string> = {
  todo: "未着手",
  doing: "進行中",
  done: "完了"
};

const priorityLabels: Record<Todo["priority"], string> = {
  low: "低",
  medium: "中",
  high: "高"
};

export function statusLabel(status: TodoStatus): string {
  return statusLabels[status];
}

export function priorityLabel(priority: Todo["priority"]): string {
  return priorityLabels[priority];
}

export function categoryLabel(categoryId: string, categories: TodoCategory[]): string {
  return categories.find((category) => category.id === categoryId)?.name ?? "未分類";
}

export function categoryColor(categoryId: string, categories: TodoCategory[]): string {
  return categories.find((category) => category.id === categoryId)?.color ?? "#64748b";
}
