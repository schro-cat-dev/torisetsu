import type { Todo, TodoCategory, TodoCategoryInput, TodoInput, TodoStatus } from "../types";

const apiBase = import.meta.env.VITE_TODO_API_BASE ?? "http://127.0.0.1:4174/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const requestId = createRequestId();
  const response = await fetch(`${apiBase}${path}`, {
    headers: {
      "Content-Type": "application/json",
      "X-Request-Id": requestId,
      ...init?.headers
    },
    ...init
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "API request failed.");
  }

  return response.json() as Promise<T>;
}

function createRequestId(): string {
  if (globalThis.crypto?.randomUUID) {
    return `web-${globalThis.crypto.randomUUID()}`;
  }

  return `web-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function fetchTodos(): Promise<Todo[]> {
  return request<Todo[]>("/todos");
}

export function fetchCategories(): Promise<TodoCategory[]> {
  return request<TodoCategory[]>("/categories");
}

export function createCategory(input: TodoCategoryInput): Promise<TodoCategory> {
  return request<TodoCategory>("/categories", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function createTodo(input: TodoInput): Promise<Todo> {
  return request<Todo>("/todos", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function updateTodo(id: string, input: TodoInput): Promise<Todo> {
  return request<Todo>(`/todos/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
}

export function updateTodoStatus(id: string, status: TodoStatus): Promise<Todo> {
  return request<Todo>(`/todos/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status })
  });
}

export function deleteTodo(id: string): Promise<{ ok: true }> {
  return request<{ ok: true }>(`/todos/${id}`, {
    method: "DELETE"
  });
}
