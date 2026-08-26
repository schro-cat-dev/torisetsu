import type { TodoInput, ValidationErrors } from "../types";
import { TODO_FORM_FIELD_META } from "./todoFormMeta";

export function validateTodoInput(input: TodoInput): ValidationErrors {
  const errors: ValidationErrors = {};
  const titleMaxLength = TODO_FORM_FIELD_META.title.maxLength;
  const descriptionMaxLength = TODO_FORM_FIELD_META.description.maxLength;

  if (!input.title.trim()) {
    errors.title = "タイトルを入力してください。";
  }

  if (titleMaxLength && input.title.trim().length > titleMaxLength) {
    errors.title = `タイトルは${titleMaxLength}文字以内にしてください。`;
  }

  if (descriptionMaxLength && input.description.length > descriptionMaxLength) {
    errors.description = `説明は${descriptionMaxLength}文字以内にしてください。`;
  }

  if (!input.categoryId) {
    errors.categoryId = "分類を選んでください。";
  }

  if (input.dueDate && Number.isNaN(Date.parse(input.dueDate))) {
    errors.dueDate = "期限の日付を確認してください。";
  }

  return errors;
}

export function hasValidationErrors(errors: ValidationErrors): boolean {
  return Object.keys(errors).length > 0;
}
