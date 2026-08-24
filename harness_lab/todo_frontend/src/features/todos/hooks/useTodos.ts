import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createTodo,
  deleteTodo,
  fetchTodos,
  updateTodo,
  updateTodoStatus
} from "../api/todoApi";
import type { StatusFilter, Todo, TodoInput, TodoSortKey, TodoStatus } from "../types";
import { getVisibleTodos } from "../utils/todoFilters";

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortKey, setSortKey] = useState<TodoSortKey>("createdDesc");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loadTodos = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      setTodos(await fetchTodos());
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "TODOを取得できませんでした。");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTodos();
  }, [loadTodos]);

  const handleCreateSubmit = useCallback(async (input: TodoInput) => {
    setIsSaving(true);
    setErrorMessage("");
    try {
      const created = await createTodo(input);
      setTodos((current) => [created, ...current]);
      return created;
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "TODOを作成できませんでした。");
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const handleEditSave = useCallback(async (todoId: string, input: TodoInput) => {
    setIsSaving(true);
    setErrorMessage("");
    try {
      const updated = await updateTodo(todoId, input);
      setTodos((current) => current.map((todo) => (todo.id === todoId ? updated : todo)));
      return updated;
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "TODOを更新できませんでした。");
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const toggleTodoStatus = useCallback(async (todoId: string, nextStatus: TodoStatus) => {
    const previousTodos = todos;
    setTodos((current) =>
      current.map((todo) => (todo.id === todoId ? { ...todo, status: nextStatus } : todo))
    );
    setErrorMessage("");

    try {
      const updated = await updateTodoStatus(todoId, nextStatus);
      setTodos((current) => current.map((todo) => (todo.id === todoId ? updated : todo)));
    } catch (error) {
      setTodos(previousTodos);
      setErrorMessage(error instanceof Error ? error.message : "状態を更新できませんでした。");
    }
  }, [todos]);

  const handleDelete = useCallback(async (todoId: string) => {
    setIsSaving(true);
    setErrorMessage("");
    try {
      await deleteTodo(todoId);
      setTodos((current) => current.filter((todo) => todo.id !== todoId));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "TODOを削除できませんでした。");
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const visibleTodos = useMemo(
    () => getVisibleTodos(todos, searchText, statusFilter, sortKey),
    [todos, searchText, statusFilter, sortKey]
  );

  return {
    todos,
    visibleTodos,
    searchText,
    statusFilter,
    sortKey,
    isLoading,
    isSaving,
    errorMessage,
    setSearchText,
    setStatusFilter,
    setSortKey,
    loadTodos,
    handleCreateSubmit,
    handleEditSave,
    toggleTodoStatus,
    handleDelete
  };
}
