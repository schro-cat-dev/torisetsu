import { useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { TodoCreateForm } from "../components/TodoCreateForm";
import { TodoDetailPanel } from "../components/TodoDetailPanel";
import { TodoHeader } from "../components/TodoHeader";
import { TodoListSection } from "../components/TodoListSection";
import { TodoToolbar } from "../components/TodoToolbar";
import { useTodos } from "../hooks/useTodos";

export function TodoPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { todoId } = useParams();
  const todos = useTodos();

  const selectedTodo = useMemo(
    () => todos.todos.find((todo) => todo.id === todoId),
    [todos.todos, todoId]
  );
  const isEditMode = location.pathname.endsWith("/edit");
  const showDetail = Boolean(todoId);

  return (
    <main className="app-shell">
      <TodoHeader totalCount={todos.todos.length} visibleCount={todos.visibleTodos.length} />

      {todos.errorMessage ? (
        <div className="global-message" role="alert">{todos.errorMessage}</div>
      ) : null}

      <div className="content-grid">
        <section className="left-column" aria-label="TODO操作">
          <TodoCreateForm
            mode="create"
            isSaving={todos.isSaving}
            onSubmit={async (input) => {
              await todos.handleCreateSubmit(input);
              navigate("/todos");
            }}
          />

          <TodoToolbar
            searchText={todos.searchText}
            statusFilter={todos.statusFilter}
            sortKey={todos.sortKey}
            onSearchTextChange={todos.setSearchText}
            onStatusFilterChange={todos.setStatusFilter}
            onSortKeyChange={todos.setSortKey}
            onReload={todos.loadTodos}
          />

          <TodoListSection
            todos={todos.visibleTodos}
            isLoading={todos.isLoading}
            errorMessage={todos.errorMessage}
            onRetry={todos.loadTodos}
            onStatusChange={todos.toggleTodoStatus}
            onDelete={todos.handleDelete}
          />
        </section>

        {showDetail ? (
          <TodoDetailPanel
            todo={selectedTodo}
            mode={isEditMode ? "edit" : "detail"}
            isSaving={todos.isSaving}
            onSave={async (id, input) => {
              await todos.handleEditSave(id, input);
              navigate(`/todos/${id}`);
            }}
            onCancel={() => navigate(selectedTodo ? `/todos/${selectedTodo.id}` : "/todos")}
          />
        ) : null}
      </div>
    </main>
  );
}
