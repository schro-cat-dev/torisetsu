import type { Todo, TodoStatus } from "../types";
import { TodoList } from "./TodoList";

type TodoListSectionProps = {
  todos: Todo[];
  isLoading: boolean;
  errorMessage: string;
  onRetry: () => void;
  onStatusChange: (todoId: string, status: TodoStatus) => void;
  onDelete: (todoId: string) => void;
};

export function TodoListSection({
  todos,
  isLoading,
  errorMessage,
  onRetry,
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
      <TodoList todos={todos} onStatusChange={onStatusChange} onDelete={onDelete} />
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
  children?: React.ReactNode;
}) {
  return (
    <section className="status-view" aria-live="polite">
      <h2>{title}</h2>
      <p>{message}</p>
      {children ? <div className="status-actions">{children}</div> : null}
    </section>
  );
}
