export type TodoStatus = "todo" | "doing" | "done";
export type TodoPriority = "low" | "medium" | "high";
export type StatusFilter = "all" | TodoStatus;
export type CategoryFilter = "all" | string;
export type TodoSortKey = "createdDesc" | "dueAsc" | "priorityDesc" | "priorityDueAsc";
export type TodoViewMode = "active" | "completed";

export type TodoCategory = {
  id: string;
  name: string;
  color: string;
  locked: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TodoCategoryInput = {
  name: string;
  color: string;
};

export type Todo = {
  id: string;
  title: string;
  description: string;
  status: TodoStatus;
  priority: TodoPriority;
  categoryId: string;
  dueDate: string;
  completedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type TodoInput = {
  title: string;
  description: string;
  priority: TodoPriority;
  categoryId: string;
  dueDate: string;
};

export type TodoFormState = TodoInput;

export type ValidationErrors = Partial<Record<keyof TodoInput, string>>;

export type TodoInputField = keyof TodoInput;

export type TodoFieldRequirement = "required" | "optional";

export type TodoFormFieldMeta = {
  key: TodoInputField;
  label: string;
  requirement: TodoFieldRequirement;
  maxLength?: number;
};
