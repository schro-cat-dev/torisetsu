import { Link } from "react-router-dom";
import type { CSSProperties } from "react";
import type { Todo, TodoCategory, TodoStatus } from "../types";
import { categoryColor, categoryLabel, priorityLabel, statusLabel } from "../utils/todoLabels";
import { TodoDetailPanel } from "./TodoDetailPanel";

type TodoListItemProps = {
  todo: Todo;
  categories: TodoCategory[];
  detailBasePath: string;
  isDetailOpen: boolean;
  onToggleDetail: (todoId: string) => void;
  onStatusChange: (todoId: string, status: TodoStatus) => void;
  onDelete: (todoId: string) => void;
};

export function TodoListItem({
  todo,
  categories,
  detailBasePath,
  isDetailOpen,
  onToggleDetail,
  onStatusChange,
  onDelete
}: TodoListItemProps) {
  const categoryStyle = {
    "--category-color": categoryColor(todo.categoryId, categories)
  } as CSSProperties;

  return (
    <li className={`todo-item${isDetailOpen ? " is-open" : ""}`}>
      <div className="todo-main">
        <input
          className="todo-status-checkbox"
          type="checkbox"
          checked={todo.status === "done"}
          aria-label={`${todo.title}を完了にする`}
          onChange={(event) => onStatusChange(todo.id, event.target.checked ? "done" : "todo")}
        />
        <button
          type="button"
          className="todo-summary-button"
          aria-expanded={isDetailOpen}
          aria-controls={`todo-detail-${todo.id}`}
          aria-label={`${isDetailOpen ? "詳細を閉じる" : "詳細を開く"}: ${todo.title}`}
          onClick={() => onToggleDetail(todo.id)}
        >
          <span className="todo-title-row">
            <span className="todo-title">{todo.title}</span>
            <span className="todo-expand-indicator" aria-hidden="true">
              {isDetailOpen ? "-" : "+"}
            </span>
          </span>
          <span className="todo-description">{todo.description || "説明なし"}</span>
          <span className="todo-meta">
            <span className={`badge status-${todo.status}`}>{statusLabel(todo.status)}</span>
            <span className={`badge priority-${todo.priority}`}>優先度: {priorityLabel(todo.priority)}</span>
            <span className="badge category" style={categoryStyle}>分類: {categoryLabel(todo.categoryId, categories)}</span>
            <span className="badge neutral">期限: {todo.dueDate || "未設定"}</span>
          </span>
        </button>
      </div>
      <div className="todo-actions">
        {todo.status !== "done" ? (
          <Link className="button ghost" to={`${detailBasePath}/${todo.id}/edit`}>
            編集
          </Link>
        ) : null}
        <button
          type="button"
          className="button danger"
          onClick={() => {
            if (window.confirm("このTODOを削除しますか？")) {
              onDelete(todo.id);
            }
          }}
        >
          削除
        </button>
      </div>
      {isDetailOpen ? (
        <div id={`todo-detail-${todo.id}`} className="todo-inline-detail">
          <TodoDetailPanel
            todo={todo}
            categories={categories}
            onCancel={() => onToggleDetail(todo.id)}
          />
        </div>
      ) : null}
    </li>
  );
}
