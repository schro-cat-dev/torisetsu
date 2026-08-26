import { FormEvent, useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import type {
  Todo,
  TodoCategory,
  TodoCategoryInput,
  TodoFormState,
  TodoInput,
  TodoInputField,
  ValidationErrors
} from "../types";
import { CATEGORY_COLOR_OPTIONS, DEFAULT_CATEGORY_COLOR } from "../utils/categoryColors";
import { TODO_FORM_FIELD_META, isOverMaxLength } from "../utils/todoFormMeta";
import { hasValidationErrors, validateTodoInput } from "../utils/validation";

const emptyForm: TodoFormState = {
  title: "",
  description: "",
  priority: "medium",
  categoryId: "",
  dueDate: ""
};

type TodoCreateFormProps = {
  mode: "create" | "edit";
  categories: TodoCategory[];
  initialTodo?: Todo;
  isSaving: boolean;
  onSubmit: (input: TodoInput) => Promise<void>;
  onCategoryCreate: (input: TodoCategoryInput) => Promise<TodoCategory>;
  onCancel?: () => void;
};

export function TodoCreateForm({
  mode,
  categories,
  initialTodo,
  isSaving,
  onSubmit,
  onCategoryCreate,
  onCancel
}: TodoCreateFormProps) {
  const [form, setForm] = useState<TodoFormState>(emptyForm);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState<string>(DEFAULT_CATEGORY_COLOR);

  useEffect(() => {
    if (!initialTodo) return;
    setForm({
      title: initialTodo.title,
      description: initialTodo.description,
      priority: initialTodo.priority,
      categoryId: initialTodo.categoryId,
      dueDate: initialTodo.dueDate
    });
    setErrors({});
  }, [initialTodo]);

  useEffect(() => {
    if (initialTodo) return;
    setForm((current) => ({
      ...current,
      categoryId: current.categoryId || categories[0]?.id || ""
    }));
  }, [categories, initialTodo]);

  const submitLabel = mode === "create" ? "追加する" : "保存する";
  const title = mode === "create" ? "新しいTODO" : "TODOを編集";
  const formId = mode === "create" ? "create" : `edit-${initialTodo?.id ?? "todo"}`;
  const isTitleOver = isOverMaxLength("title", form.title);
  const isDescriptionOver = isOverMaxLength("description", form.description);

  const isSubmitDisabled = useMemo(
    () => isSaving || !form.title.trim() || !form.categoryId || isTitleOver || isDescriptionOver,
    [form.categoryId, form.title, isDescriptionOver, isSaving, isTitleOver]
  );

  function updateField<K extends keyof TodoFormState>(key: K, value: TodoFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
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
      categoryId: form.categoryId,
      dueDate: form.dueDate
    });

    if (mode === "create") {
      setForm({ ...emptyForm, categoryId: categories[0]?.id ?? "" });
      setErrors({});
    }
  }

  return (
    <form className="form-panel" aria-label={title} onSubmit={handleSubmit}>
      <div className="section-heading">
        <h2>{title}</h2>
      </div>

      <div className="field-grid">
        <div className="field full">
          <FieldLabel formId={formId} field="title" />
          <input
            id={`${formId}-title`}
            value={form.title}
            aria-describedby={descriptionIds(formId, "title", errors.title)}
            aria-invalid={Boolean(errors.title)}
            placeholder="例: 請求書を確認する"
            onChange={(event) => updateField("title", event.target.value)}
          />
          <CharacterCount formId={formId} field="title" value={form.title} />
          {errors.title ? <p className="field-error" id={`${formId}-title-error`}>{errors.title}</p> : null}
        </div>

        <div className="field full">
          <FieldLabel formId={formId} field="description" />
          <textarea
            id={`${formId}-description`}
            value={form.description}
            aria-describedby={descriptionIds(formId, "description", errors.description)}
            aria-invalid={Boolean(errors.description)}
            placeholder="必要なメモだけ短く書きます"
            onChange={(event) => updateField("description", event.target.value)}
          />
          <CharacterCount formId={formId} field="description" value={form.description} />
          {errors.description ? (
            <p className="field-error" id={`${formId}-description-error`}>{errors.description}</p>
          ) : null}
        </div>

        <div className="field">
          <FieldLabel formId={formId} field="priority" />
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
          <FieldLabel formId={formId} field="categoryId" tooltip="日常は家事など、生活まわりのTODOに使います。" />
          <select
            id={`${formId}-categoryId`}
            value={form.categoryId}
            aria-describedby={errors.categoryId ? `${formId}-categoryId-error` : undefined}
            aria-invalid={Boolean(errors.categoryId)}
            onChange={(event) => updateField("categoryId", event.target.value)}
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {errors.categoryId ? <p className="field-error" id={`${formId}-categoryId-error`}>{errors.categoryId}</p> : null}
          <div className="inline-create">
            <input
              aria-label="追加する分類名"
              value={newCategoryName}
              maxLength={24}
              placeholder="分類を追加"
              onChange={(event) => setNewCategoryName(event.target.value)}
            />
            <button
              type="button"
              className="button secondary"
              disabled={isSaving || !newCategoryName.trim()}
              onClick={async () => {
                const category = await onCategoryCreate({
                  name: newCategoryName.trim(),
                  color: newCategoryColor
                });
                updateField("categoryId", category.id);
                setNewCategoryName("");
              }}
            >
              追加
            </button>
          </div>
          <div className="color-picker" aria-label="分類色">
            {CATEGORY_COLOR_OPTIONS.map((color) => (
              <button
                key={color.value}
                type="button"
                className={`color-swatch-button ${newCategoryColor === color.value ? "is-selected" : ""}`}
                style={{ "--category-color": color.value } as CSSProperties}
                aria-label={`分類色: ${color.label}`}
                aria-pressed={newCategoryColor === color.value}
                onClick={() => setNewCategoryColor(color.value)}
              />
            ))}
          </div>
        </div>

        <div className="field">
          <FieldLabel formId={formId} field="dueDate" />
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

function FieldLabel({
  formId,
  field,
  tooltip
}: {
  formId: string;
  field: TodoInputField;
  tooltip?: string;
}) {
  const meta = TODO_FORM_FIELD_META[field];
  const requirementLabel = meta.requirement === "required" ? "必須" : "任意";

  return (
    <div className="field-label-row">
      <span className="label-with-help">
        <label htmlFor={`${formId}-${field}`}>{meta.label}</label>
        <span className={`requirement-badge ${meta.requirement}`}>{requirementLabel}</span>
        {tooltip ? (
          <button type="button" className="help-button" aria-label={`${meta.label}の補足`}>
            ?
            <span className="tooltip" role="tooltip">{tooltip}</span>
          </button>
        ) : null}
      </span>
    </div>
  );
}

function CharacterCount({
  formId,
  field,
  value
}: {
  formId: string;
  field: TodoInputField;
  value: string;
}) {
  const meta = TODO_FORM_FIELD_META[field];

  if (!meta.maxLength) {
    return null;
  }

  const isOver = value.length > meta.maxLength;

  return (
    <p
      className={`character-count ${isOver ? "over-limit" : ""}`}
      id={`${formId}-${field}-count`}
      aria-live="polite"
    >
      {value.length} / {meta.maxLength}文字
    </p>
  );
}

function descriptionIds(formId: string, field: TodoInputField, error?: string) {
  const ids = [`${formId}-${field}-count`];

  if (error) {
    ids.push(`${formId}-${field}-error`);
  }

  return ids.join(" ");
}
