import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createCategory,
  createTodo,
  deleteTodo,
  fetchCategories,
  fetchTodos,
  updateTodo,
  updateTodoStatus
} from "../api/todoApi";
import type {
  CategoryFilter,
  StatusFilter,
  Todo,
  TodoCategory,
  TodoCategoryInput,
  TodoInput,
  TodoSortKey,
  TodoStatus
} from "../types";
import { getVisibleTodos } from "../utils/todoFilters";

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [categories, setCategories] = useState<TodoCategory[]>([]);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [sortKey, setSortKey] = useState<TodoSortKey>("createdDesc");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loadTodos = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const [nextTodos, nextCategories] = await Promise.all([fetchTodos(), fetchCategories()]);
      setTodos(nextTodos);
      setCategories(nextCategories);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "TODOを取得できませんでした。");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleCategoryCreate = useCallback(async (input: TodoCategoryInput) => {
    setIsSaving(true);
    setErrorMessage("");
    try {
      const category = await createCategory(input);
      setCategories((current) => [...current, category]);
      return category;
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "分類を追加できませんでした。");
      throw error;
    } finally {
      setIsSaving(false);
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
      if (categoryFilter !== "all" && categoryFilter !== updated.categoryId) {
        setCategoryFilter(updated.categoryId);
      }
      return updated;
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "TODOを更新できませんでした。");
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [categoryFilter]);

  const toggleTodoStatus = useCallback(async (todoId: string, nextStatus: TodoStatus) => {
    const previousTodos = todos;
    setTodos((current) =>
      current.map((todo) => (todo.id === todoId ? { ...todo, status: nextStatus } : todo))
    );
    setErrorMessage("");

    try {
      const updated = await updateTodoStatus(todoId, nextStatus);
      setTodos((current) => current.map((todo) => (todo.id === todoId ? updated : todo)));
      if (nextStatus === "done") {
        setStatusFilter("all");
      }
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
    () => getVisibleTodos(todos, searchText, statusFilter, categoryFilter, sortKey),
    [todos, searchText, statusFilter, categoryFilter, sortKey]
  );

  return {
    todos,
    categories,
    visibleTodos,
    searchText,
    statusFilter,
    categoryFilter,
    sortKey,
    isLoading,
    isSaving,
    errorMessage,
    setSearchText,
    setStatusFilter,
    setCategoryFilter,
    setSortKey,
    loadTodos,
    handleCategoryCreate,
    handleCreateSubmit,
    handleEditSave,
    toggleTodoStatus,
    handleDelete
  };
}
