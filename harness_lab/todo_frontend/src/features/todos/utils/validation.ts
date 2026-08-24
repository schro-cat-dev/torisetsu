import type { TodoInput, ValidationErrors } from "../types";

export function validateTodoInput(input: TodoInput): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!input.title.trim()) {
    errors.title = "タイトルを入力してください。";
  }

  if (input.title.trim().length > 80) {
    errors.title = "タイトルは80文字以内にしてください。";
  }

  if (input.description.length > 400) {
    errors.description = "説明は400文字以内にしてください。";
  }

  if (input.dueDate && Number.isNaN(Date.parse(input.dueDate))) {
    errors.dueDate = "期限の日付を確認してください。";
  }

  return errors;
}

export function hasValidationErrors(errors: ValidationErrors): boolean {
  return Object.keys(errors).length > 0;
}
