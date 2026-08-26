import type { ReactNode } from "react";
import type { Todo, TodoCategory, TodoStatus } from "../types";
import { TodoList } from "./TodoList";

type TodoListSectionProps = {
  todos: Todo[];
  totalCount: number;
  categories: TodoCategory[];
  detailBasePath: string;
  isLoading: boolean;
  errorMessage: string;
  onRetry: () => void;
  openDetailTodoId?: string;
  onToggleDetail: (todoId: string) => void;
  onStatusChange: (todoId: string, status: TodoStatus) => void;
  onDelete: (todoId: string) => void;
};

export function TodoListSection({
  todos,
  totalCount,
  categories,
  detailBasePath,
  isLoading,
  errorMessage,
  onRetry,
  openDetailTodoId,
  onToggleDetail,
  onStatusChange,
  onDelete
}: TodoListSectionProps) {
  if (isLoading) {
    return <StatusView title="読み込み中" message="TODOを取得しています。" />;
  }

  if (errorMessage) {
    return (
      <StatusView title="取得できませんでした" message={errorMessage}>
        <button type="button" className="button secondary" onClick={onRetry}>
          もう一度試す
        </button>
      </StatusView>
    );
  }

  if (todos.length === 0) {
    return <StatusView title="表示できるTODOがありません" message="検索条件を変えるか、新しいTODOを追加してください。" />;
  }

  return (
    <section className="list-section" aria-label="TODO一覧">
      <div className="list-summary" aria-label="表示件数">
        {todos.length} / {totalCount} 件
      </div>
      <TodoList
        todos={todos}
        categories={categories}
        detailBasePath={detailBasePath}
        openDetailTodoId={openDetailTodoId}
        onToggleDetail={onToggleDetail}
        onStatusChange={onStatusChange}
        onDelete={onDelete}
      />
    </section>
  );
}

function StatusView({
  title,
  message,
  children
}: {
  title: string;
  message: string;
  children?: ReactNode;
}) {
  return (
    <section className="status-view" aria-live="polite">
      <h2>{title}</h2>
      <p>{message}</p>
      {children ? <div className="status-actions">{children}</div> : null}
    </section>
  );
}
