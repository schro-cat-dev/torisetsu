import { useState, type FormEvent } from "react";
import {
  validateFieldValues,
  type FieldDefinition,
  type FieldErrors,
  type FieldValue,
  type ItemFieldValues,
} from "@torisetsu/configurable-list-core";

export interface ConfigurableItemFormProps<FieldName extends string> {
  fields: ReadonlyArray<FieldDefinition<FieldName>>;
  initialValues: ItemFieldValues<FieldName>;
  submitLabel: string;
  onSubmit: (values: ItemFieldValues<FieldName>) => void;
  onCancel: () => void;
}

export function ConfigurableItemForm<FieldName extends string>({
  fields,
  initialValues,
  submitLabel,
  onSubmit,
  onCancel,
}: ConfigurableItemFormProps<FieldName>) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<FieldErrors<FieldName>>({});

  const setFieldValue = (name: FieldName, value: FieldValue) => {
    setValues((currentValues) => ({ ...currentValues, [name]: value }));
    setErrors((currentErrors) => ({ ...currentErrors, [name]: undefined }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateFieldValues(fields, values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length === 0) {
      onSubmit(values);
    }
  };

  return (
    <form className="item-form" onSubmit={handleSubmit} noValidate>
      <div className="field-grid">
        {fields.map((field) => (
          <DynamicField
            key={field.name}
            field={field}
            value={values[field.name]}
            error={errors[field.name]}
            onChange={(value) => setFieldValue(field.name, value)}
          />
        ))}
      </div>

      <div className="form-actions">
        <button className="button secondary" type="button" onClick={onCancel}>
          キャンセル
        </button>
        <button className="button primary" type="submit">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

interface DynamicFieldProps<FieldName extends string> {
  field: FieldDefinition<FieldName>;
  value: FieldValue;
  error?: string;
  onChange: (value: FieldValue) => void;
}

function DynamicField<FieldName extends string>({
  field,
  value,
  error,
  onChange,
}: DynamicFieldProps<FieldName>) {
  const inputId = `field-${field.name}`;
  const descriptionId = field.description ? `${inputId}-description` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [descriptionId, errorId].filter(Boolean).join(" ") || undefined;

  if (field.type === "checkbox") {
    return (
      <div className={`field checkbox-field ${field.fullWidth ? "full" : ""}`}>
        <label htmlFor={inputId}>
          <input
            id={inputId}
            type="checkbox"
            checked={Boolean(value)}
            onChange={(event) => onChange(event.target.checked)}
          />
          <span>{field.label}</span>
        </label>
        {field.description ? (
          <p id={descriptionId} className="field-description">
            {field.description}
          </p>
        ) : null}
      </div>
    );
  }

  const sharedInputProps = {
    id: inputId,
    name: field.name,
    required: field.required,
    "aria-invalid": Boolean(error),
    "aria-describedby": describedBy,
  };

  return (
    <div className={`field ${field.fullWidth ? "full" : ""}`}>
      <div className="field-label-row">
        <label htmlFor={inputId}>{field.label}</label>
        <span className={`requirement ${field.required ? "required" : "optional"}`}>
          {field.required ? "必須" : "任意"}
        </span>
      </div>

      {field.type === "textarea" ? (
        <textarea
          {...sharedInputProps}
          value={String(value)}
          placeholder={field.placeholder}
          maxLength={field.maxLength}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : field.type === "select" ? (
        <select
          {...sharedInputProps}
          value={String(value)}
          onChange={(event) => onChange(event.target.value)}
        >
          {field.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : field.type === "number" ? (
        <input
          {...sharedInputProps}
          type="number"
          value={typeof value === "number" && Number.isFinite(value) ? value : ""}
          min={field.min}
          max={field.max}
          step={field.step}
          onChange={(event) =>
            onChange(event.target.value === "" ? "" : event.target.valueAsNumber)
          }
        />
      ) : (
        <input
          {...sharedInputProps}
          type="text"
          value={String(value)}
          placeholder={field.placeholder}
          maxLength={field.maxLength}
          onChange={(event) => onChange(event.target.value)}
        />
      )}

      {field.description ? (
        <p id={descriptionId} className="field-description">
          {field.description}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="field-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
