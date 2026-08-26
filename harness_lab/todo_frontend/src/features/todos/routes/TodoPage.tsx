import { useEffect, useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { TodoCategoryBar } from "../components/TodoCategoryBar";
import { TodoCreateForm } from "../components/TodoCreateForm";
import { TodoHeader } from "../components/TodoHeader";
import { TodoListSection } from "../components/TodoListSection";
import { TodoToolbar } from "../components/TodoToolbar";
import { useTodos } from "../hooks/useTodos";
import { filterTodosByViewMode, sortCompletedTodos } from "../utils/todoFilters";

export function TodoPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { todoId } = useParams();
  const todos = useTodos();
  const { setStatusFilter, statusFilter } = todos;

  const selectedTodo = useMemo(
    () => todos.todos.find((todo) => todo.id === todoId),
    [todos.todos, todoId]
  );
  const isEditMode = location.pathname.endsWith("/edit");
  const isCreateMode = location.pathname === "/todos/new";
  const isCompletedMode = location.pathname.startsWith("/todos/completed");
  const isDetailMode = Boolean(todoId) && !isEditMode;
  const viewMode = isCompletedMode ? "completed" : "active";
  const detailBasePath = isCompletedMode ? "/todos/completed" : "/todos";
  const displayTodos = useMemo(() => {
    const nextTodos = filterTodosByViewMode(todos.visibleTodos, viewMode);
    return isCompletedMode ? sortCompletedTodos(nextTodos) : nextTodos;
  }, [isCompletedMode, todos.visibleTodos, viewMode]);
  const selectedTodoMissing = Boolean(todoId && !todos.isLoading && !selectedTodo);

  useEffect(() => {
    if (isCompletedMode && statusFilter !== "all") {
      setStatusFilter("all");
    }
  }, [isCompletedMode, setStatusFilter, statusFilter]);

  return (
    <main className="app-shell">
      <TodoHeader
        isCreateMode={isCreateMode}
        isCompletedMode={isCompletedMode}
      />

      {todos.errorMessage ? (
        <div className="global-message" role="alert">{todos.errorMessage}</div>
      ) : null}
      {selectedTodoMissing ? (
        <div className="global-message" role="alert">選択したTODOが見つかりません。</div>
      ) : null}

      <div className="content-grid">
        <section className="left-column" aria-label="TODO操作">
          <TodoCategoryBar
            categories={todos.categories}
            categoryFilter={todos.categoryFilter}
            isSaving={todos.isSaving}
            onCategoryFilterChange={todos.setCategoryFilter}
            onCategoryCreate={todos.handleCategoryCreate}
          />

          <TodoToolbar
            searchText={todos.searchText}
            statusFilter={todos.statusFilter}
            sortKey={todos.sortKey}
            viewMode={viewMode}
            onSearchTextChange={todos.setSearchText}
            onStatusFilterChange={todos.setStatusFilter}
            onSortKeyChange={todos.setSortKey}
          />

          <TodoListSection
            todos={displayTodos}
            totalCount={filterTodosByViewMode(todos.todos, viewMode).length}
            categories={todos.categories}
            isLoading={todos.isLoading}
            errorMessage={todos.errorMessage}
            onRetry={todos.loadTodos}
            openDetailTodoId={isDetailMode ? todoId : undefined}
            onToggleDetail={(id) => navigate(todoId === id && isDetailMode ? detailBasePath : `${detailBasePath}/${id}`)}
            onStatusChange={todos.toggleTodoStatus}
            detailBasePath={detailBasePath}
            onDelete={todos.handleDelete}
          />
        </section>
      </div>
      {isCreateMode ? (
        <div className="modal-backdrop">
          <div className="modal-shell" role="dialog" aria-modal="true" aria-label="新しいTODO">
            <TodoCreateForm
              mode="create"
              categories={todos.categories}
              isSaving={todos.isSaving}
              onSubmit={async (input) => {
                await todos.handleCreateSubmit(input);
                navigate("/todos");
              }}
              onCategoryCreate={todos.handleCategoryCreate}
              onCancel={() => navigate("/todos")}
            />
          </div>
        </div>
      ) : null}
      {isEditMode && selectedTodo && selectedTodo.status !== "done" ? (
        <div className="modal-backdrop">
          <div className="modal-shell" role="dialog" aria-modal="true" aria-label="TODOを編集">
            <TodoCreateForm
              mode="edit"
              categories={todos.categories}
              initialTodo={selectedTodo}
              isSaving={todos.isSaving}
              onSubmit={async (input) => {
                await todos.handleEditSave(selectedTodo.id, input);
                navigate(detailBasePath);
              }}
              onCategoryCreate={todos.handleCategoryCreate}
              onCancel={() => navigate(`${detailBasePath}/${selectedTodo.id}`)}
            />
          </div>
        </div>
      ) : null}
    </main>
  );
}
