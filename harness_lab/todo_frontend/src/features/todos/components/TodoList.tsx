import type { Todo, TodoCategory, TodoStatus } from "../types";
import { TodoListItem } from "./TodoListItem";

type TodoListProps = {
  todos: Todo[];
  categories: TodoCategory[];
  detailBasePath: string;
  openDetailTodoId?: string;
  onToggleDetail: (todoId: string) => void;
  onStatusChange: (todoId: string, status: TodoStatus) => void;
  onDelete: (todoId: string) => void;
};

export function TodoList({
  todos,
  categories,
  detailBasePath,
  openDetailTodoId,
  onToggleDetail,
  onStatusChange,
  onDelete
}: TodoListProps) {
  return (
    <ul className="todo-list">
      {todos.map((todo) => (
        <TodoListItem
          key={todo.id}
          todo={todo}
          categories={categories}
          detailBasePath={detailBasePath}
          isDetailOpen={openDetailTodoId === todo.id}
          onToggleDetail={onToggleDetail}
          onStatusChange={onStatusChange}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}
