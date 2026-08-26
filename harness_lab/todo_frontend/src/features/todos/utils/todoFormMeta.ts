import type { TodoFormFieldMeta, TodoInput } from "../types";

export const TODO_FORM_FIELD_META: Record<keyof TodoInput, TodoFormFieldMeta> = {
  title: {
    key: "title",
    label: "タイトル",
    requirement: "required",
    maxLength: 80
  },
  description: {
    key: "description",
    label: "説明",
    requirement: "optional",
    maxLength: 400
  },
  priority: {
    key: "priority",
    label: "優先度",
    requirement: "optional"
  },
  categoryId: {
    key: "categoryId",
    label: "分類",
    requirement: "required"
  },
  dueDate: {
    key: "dueDate",
    label: "期限",
    requirement: "optional"
  }
};

export function isOverMaxLength(field: keyof TodoInput, value: string): boolean {
  const maxLength = TODO_FORM_FIELD_META[field].maxLength;
  return typeof maxLength === "number" && value.length > maxLength;
}
