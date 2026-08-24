import { Link } from "react-router-dom";
import type { Todo, TodoStatus } from "../types";

const statusLabels: Record<TodoStatus, string> = {
  todo: "未着手",
  doing: "進行中",
  done: "完了"
};

type TodoListItemProps = {
  todo: Todo;
  onStatusChange: (todoId: string, status: TodoStatus) => void;
  onDelete: (todoId: string) => void;
};

export function TodoListItem({ todo, onStatusChange, onDelete }: TodoListItemProps) {
  return (
    <li className="todo-item">
      <div className="todo-main">
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={todo.status === "done"}
            onChange={(event) => onStatusChange(todo.id, event.target.checked ? "done" : "todo")}
          />
          <span className="todo-title">{todo.title}</span>
        </label>
        <p className="todo-description">{todo.description || "説明なし"}</p>
        <div className="todo-meta">
          <span className={`badge status-${todo.status}`}>{statusLabels[todo.status]}</span>
          <span className={`badge priority-${todo.priority}`}>優先度: {priorityLabel(todo.priority)}</span>
          <span className="badge neutral">期限: {todo.dueDate || "未設定"}</span>
        </div>
      </div>
      <div className="todo-actions">
        <Link className="button ghost" to={`/todos/${todo.id}`}>
          詳細
        </Link>
        <Link className="button ghost" to={`/todos/${todo.id}/edit`}>
          編集
        </Link>
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
    </li>
  );
}

function priorityLabel(priority: Todo["priority"]) {
  if (priority === "high") return "高";
  if (priority === "medium") return "中";
  return "低";
}
