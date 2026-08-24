import { Link } from "react-router-dom";
import type { Todo, TodoInput } from "../types";
import { TodoCreateForm } from "./TodoCreateForm";

type TodoDetailPanelProps = {
  todo?: Todo;
  mode: "detail" | "edit";
  isSaving: boolean;
  onSave: (todoId: string, input: TodoInput) => Promise<void>;
  onCancel: () => void;
};

export function TodoDetailPanel({ todo, mode, isSaving, onSave, onCancel }: TodoDetailPanelProps) {
  if (!todo) {
    return (
      <aside className="detail-panel" aria-live="polite">
        <h2>TODOが見つかりません</h2>
        <p>一覧から別のTODOを選んでください。</p>
        <Link className="button secondary" to="/todos">一覧へ戻る</Link>
      </aside>
    );
  }

  if (mode === "edit") {
    return (
      <aside className="detail-panel">
        <TodoCreateForm
          mode="edit"
          initialTodo={todo}
          isSaving={isSaving}
          onSubmit={(input) => onSave(todo.id, input)}
          onCancel={onCancel}
        />
      </aside>
    );
  }

  return (
    <aside className="detail-panel">
      <div className="section-heading">
        <h2>{todo.title}</h2>
        <p>{todo.description || "説明はありません。"}</p>
      </div>
      <dl className="detail-list">
        <div>
          <dt>状態</dt>
          <dd>{todo.status}</dd>
        </div>
        <div>
          <dt>優先度</dt>
          <dd>{todo.priority}</dd>
        </div>
        <div>
          <dt>期限</dt>
          <dd>{todo.dueDate || "未設定"}</dd>
        </div>
        <div>
          <dt>更新日時</dt>
          <dd>{new Date(todo.updatedAt).toLocaleString("ja-JP")}</dd>
        </div>
      </dl>
      <div className="form-actions">
        <Link className="button secondary" to="/todos">閉じる</Link>
        <Link className="button primary" to={`/todos/${todo.id}/edit`}>編集する</Link>
      </div>
    </aside>
  );
}
