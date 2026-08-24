import type { Todo, TodoStatus } from "../types";
import { TodoListItem } from "./TodoListItem";

type TodoListProps = {
  todos: Todo[];
  onStatusChange: (todoId: string, status: TodoStatus) => void;
  onDelete: (todoId: string) => void;
};

export function TodoList({ todos, onStatusChange, onDelete }: TodoListProps) {
  return (
    <ul className="todo-list">
      {todos.map((todo) => (
        <TodoListItem
          key={todo.id}
          todo={todo}
          onStatusChange={onStatusChange}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}
