import { Link } from "react-router-dom";
import { APP_VERSION } from "../../../appVersion";

type TodoHeaderProps = {
  totalCount: number;
  visibleCount: number;
};

export function TodoHeader({ totalCount, visibleCount }: TodoHeaderProps) {
  return (
    <header className="todo-header">
      <div>
        <p className="eyebrow">Quality Harness</p>
        <h1>TODO管理 <span className="version-label">v{APP_VERSION}</span></h1>
      </div>
      <div className="header-actions" aria-label="TODO件数">
        <span>{visibleCount} / {totalCount} 件</span>
        <Link className="button secondary" to="/todos/new">新規作成</Link>
      </div>
    </header>
  );
}
