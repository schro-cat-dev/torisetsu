import { Link } from "react-router-dom";

type TodoHeaderProps = {
  isCreateMode: boolean;
  isCompletedMode: boolean;
};

export function TodoHeader({ isCreateMode, isCompletedMode }: TodoHeaderProps) {
  return (
    <header className="todo-header">
      <div>
        <h1>TODO管理</h1>
      </div>
      <div className="header-actions" aria-label="TODO操作">
        {isCompletedMode ? (
          <Link className="button secondary" to="/todos">
            未完了を見る
          </Link>
        ) : null}
        {!isCreateMode && !isCompletedMode ? (
          <>
            <Link className="button secondary" to="/todos/completed">
              完了済み
            </Link>
            <Link className="button primary" to="/todos/new">
              新規作成
            </Link>
          </>
        ) : null}
      </div>
    </header>
  );
}
