import type { Todo, TodoInput, TodoStatus } from "../types";

const apiBase = import.meta.env.VITE_TODO_API_BASE ?? "http://127.0.0.1:4174/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, {
    headers: {
      "Content-Type": "application/json",
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

export function fetchTodos(): Promise<Todo[]> {
  return request<Todo[]>("/todos");
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
