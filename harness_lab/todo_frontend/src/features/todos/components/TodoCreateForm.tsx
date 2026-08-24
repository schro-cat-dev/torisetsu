import { FormEvent, useEffect, useMemo, useState } from "react";
import type { Todo, TodoFormState, TodoInput, ValidationErrors } from "../types";
import { hasValidationErrors, validateTodoInput } from "../utils/validation";

const emptyForm: TodoFormState = {
  title: "",
  description: "",
  priority: "medium",
  dueDate: ""
};

type TodoCreateFormProps = {
  mode: "create" | "edit";
  initialTodo?: Todo;
  isSaving: boolean;
  onSubmit: (input: TodoInput) => Promise<void>;
  onCancel?: () => void;
};

export function TodoCreateForm({
  mode,
  initialTodo,
  isSaving,
  onSubmit,
  onCancel
}: TodoCreateFormProps) {
  const [form, setForm] = useState<TodoFormState>(emptyForm);
  const [errors, setErrors] = useState<ValidationErrors>({});

  useEffect(() => {
    if (!initialTodo) {
      setForm(emptyForm);
      setErrors({});
      return;
    }

    setForm({
      title: initialTodo.title,
      description: initialTodo.description,
      priority: initialTodo.priority,
      dueDate: initialTodo.dueDate
    });
    setErrors({});
  }, [initialTodo]);

  const submitLabel = mode === "create" ? "追加する" : "保存する";
  const title = mode === "create" ? "新しいTODO" : "TODOを編集";
  const formId = mode === "create" ? "create" : `edit-${initialTodo?.id ?? "todo"}`;

  const isSubmitDisabled = useMemo(
    () => isSaving || !form.title.trim(),
    [form.title, isSaving]
  );

  function updateField<K extends keyof TodoFormState>(key: K, value: TodoFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateTodoInput(form);
    setErrors(nextErrors);

    if (hasValidationErrors(nextErrors)) {
      return;
    }

    await onSubmit({
      title: form.title.trim(),
      description: form.description.trim(),
      priority: form.priority,
      dueDate: form.dueDate
    });

    if (mode === "create") {
      setForm(emptyForm);
      setErrors({});
    }
  }

  return (
    <form className="form-panel" aria-label={title} onSubmit={handleSubmit}>
      <div className="section-heading">
        <h2>{title}</h2>
        <p>タイトルだけで保存できます。期限と優先度は後から変更できます。</p>
      </div>

      <div className="field-grid">
        <div className="field full">
          <label htmlFor={`${formId}-title`}>タイトル</label>
          <input
            id={`${formId}-title`}
            value={form.title}
            maxLength={80}
            aria-describedby={errors.title ? `${formId}-title-error` : undefined}
            aria-invalid={Boolean(errors.title)}
            placeholder="例: 請求書を確認する"
            onChange={(event) => updateField("title", event.target.value)}
          />
          {errors.title ? <p className="field-error" id={`${formId}-title-error`}>{errors.title}</p> : null}
        </div>

        <div className="field full">
          <label htmlFor={`${formId}-description`}>説明</label>
          <textarea
            id={`${formId}-description`}
            value={form.description}
            maxLength={400}
            aria-describedby={errors.description ? `${formId}-description-error` : undefined}
            aria-invalid={Boolean(errors.description)}
            placeholder="必要なメモだけ短く書きます"
            onChange={(event) => updateField("description", event.target.value)}
          />
          {errors.description ? (
            <p className="field-error" id={`${formId}-description-error`}>{errors.description}</p>
          ) : null}
        </div>

        <div className="field">
          <label htmlFor={`${formId}-priority`}>優先度</label>
          <select
            id={`${formId}-priority`}
            value={form.priority}
            onChange={(event) => updateField("priority", event.target.value as TodoFormState["priority"])}
          >
            <option value="low">低</option>
            <option value="medium">中</option>
            <option value="high">高</option>
          </select>
        </div>

        <div className="field">
          <label htmlFor={`${formId}-dueDate`}>期限</label>
          <input
            id={`${formId}-dueDate`}
            type="date"
            value={form.dueDate}
            aria-describedby={errors.dueDate ? `${formId}-dueDate-error` : undefined}
            aria-invalid={Boolean(errors.dueDate)}
            onChange={(event) => updateField("dueDate", event.target.value)}
          />
          {errors.dueDate ? <p className="field-error" id={`${formId}-dueDate-error`}>{errors.dueDate}</p> : null}
        </div>
      </div>

      <div className="form-actions">
        {onCancel ? (
          <button type="button" className="button secondary" onClick={onCancel}>
            キャンセル
          </button>
        ) : null}
        <button type="submit" className="button primary" disabled={isSubmitDisabled}>
          {isSaving ? "保存中" : submitLabel}
        </button>
      </div>
    </form>
  );
}
