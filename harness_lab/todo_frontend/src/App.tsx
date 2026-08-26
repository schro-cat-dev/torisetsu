import { Navigate, Route, Routes } from "react-router-dom";
import { TodoPage } from "./features/todos/routes/TodoPage";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/todos" replace />} />
      <Route path="/todos" element={<TodoPage />} />
      <Route path="/todos/new" element={<TodoPage />} />
      <Route path="/todos/completed" element={<TodoPage />} />
      <Route path="/todos/completed/:todoId" element={<TodoPage />} />
      <Route path="/todos/completed/:todoId/edit" element={<TodoPage />} />
      <Route path="/todos/:todoId" element={<TodoPage />} />
      <Route path="/todos/:todoId/edit" element={<TodoPage />} />
      <Route path="*" element={<Navigate to="/todos" replace />} />
    </Routes>
  );
}
