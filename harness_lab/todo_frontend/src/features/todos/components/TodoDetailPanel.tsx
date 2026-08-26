import { Link } from "react-router-dom";
import type { Todo, TodoCategory } from "../types";
import { categoryLabel, priorityLabel, statusLabel } from "../utils/todoLabels";

type TodoDetailPanelProps = {
  todo?: Todo;
  categories: TodoCategory[];
  editPath?: string;
  onCancel: () => void;
};

export function TodoDetailPanel({
  todo,
  categories,
  editPath,
  onCancel
}: TodoDetailPanelProps) {
  if (!todo) {
    return (
      <aside className="detail-panel" aria-live="polite">
        <h2>TODOが見つかりません</h2>
        <p>一覧から別のTODOを選んでください。</p>
        <button type="button" className="button secondary" onClick={onCancel}>
          一覧へ戻る
        </button>
      </aside>
    );
  }

  return (
    <section className="detail-panel">
      <div className="section-heading">
        <h2>{todo.title}</h2>
        <p>{todo.description || "説明はありません。"}</p>
      </div>
      <dl className="detail-list">
        <div>
          <dt>状態</dt>
          <dd>{statusLabel(todo.status)}</dd>
        </div>
        <div>
          <dt>優先度</dt>
          <dd>{priorityLabel(todo.priority)}</dd>
        </div>
        <div>
          <dt>分類</dt>
          <dd>{categoryLabel(todo.categoryId, categories)}</dd>
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
        <button type="button" className="button secondary" onClick={onCancel}>
          閉じる
        </button>
        {editPath ? (
          <Link className="button primary" to={editPath}>
            編集する
          </Link>
        ) : null}
      </div>
    </section>
  );
}
