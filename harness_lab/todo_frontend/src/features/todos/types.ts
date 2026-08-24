export type TodoStatus = "todo" | "doing" | "done";
export type TodoPriority = "low" | "medium" | "high";
export type StatusFilter = "all" | TodoStatus;
export type TodoSortKey = "createdDesc" | "dueAsc" | "priorityDesc";

export type Todo = {
  id: string;
  title: string;
  description: string;
  status: TodoStatus;
  priority: TodoPriority;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
};

export type TodoInput = {
  title: string;
  description: string;
  priority: TodoPriority;
  dueDate: string;
};

export type TodoFormState = TodoInput;

export type ValidationErrors = Partial<Record<keyof TodoInput, string>>;
