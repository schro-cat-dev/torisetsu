import type {
  CollectionDefinition,
  ConfigurableItem,
  FieldDefinition,
  FieldErrors,
  ItemFieldValues,
} from "./types";

function getDefaultValue<FieldName extends string>(
  field: FieldDefinition<FieldName>,
) {
  if (field.defaultValue !== undefined) {
    return field.defaultValue;
  }

  if (field.type === "checkbox") {
    return false;
  }

  if (field.type === "number") {
    return field.min ?? 0;
  }

  if (field.type === "select") {
    return field.options[0]?.value ?? "";
  }

  return "";
}

export function createDefaultFieldValues<FieldName extends string>(
  fields: ReadonlyArray<FieldDefinition<FieldName>>,
): ItemFieldValues<FieldName> {
  return Object.fromEntries(
    fields.map((field) => [field.name, getDefaultValue(field)]),
  ) as ItemFieldValues<FieldName>;
}

export function createDraftItem<FieldName extends string>(
  definition: CollectionDefinition<FieldName>,
  itemId: string,
): ConfigurableItem<FieldName> {
  const { field: titleField, value: initialTitle } =
    definition.creation.initialTitle;
  const titleFieldDefinition = definition.fields.find(
    (field) => field.name === titleField,
  );

  if (
    !titleFieldDefinition ||
    (titleFieldDefinition.type !== "text" &&
      titleFieldDefinition.type !== "textarea")
  ) {
    throw new Error(
      `Initial title field "${titleField}" must be a text or textarea field.`,
    );
  }

  return {
    id: itemId,
    values: {
      ...createDefaultFieldValues(definition.fields),
      [titleField]: initialTitle,
    },
  };
}

export function validateFieldValues<FieldName extends string>(
  fields: ReadonlyArray<FieldDefinition<FieldName>>,
  values: ItemFieldValues<FieldName>,
): FieldErrors<FieldName> {
  const errors: FieldErrors<FieldName> = {};

  for (const field of fields) {
    const value = values[field.name];

    const isMissing =
      value === undefined ||
      value === null ||
      String(value).trim() === "" ||
      (field.type === "checkbox" && value !== true) ||
      (field.type === "number" &&
        (typeof value !== "number" || !Number.isFinite(value)));

    if (field.required && isMissing) {
      errors[field.name] = `${field.label}を入力してください。`;
      continue;
    }

    if (
      (field.type === "text" || field.type === "textarea") &&
      field.maxLength !== undefined &&
      String(value).length > field.maxLength
    ) {
      errors[field.name] = `${field.label}は${field.maxLength}文字以内で入力してください。`;
      continue;
    }

    if (field.type === "number" && typeof value === "number") {
      if (field.min !== undefined && value < field.min) {
        errors[field.name] = `${field.label}は${field.min}以上にしてください。`;
      } else if (field.max !== undefined && value > field.max) {
        errors[field.name] = `${field.label}は${field.max}以下にしてください。`;
      }
    }

    if (
      field.type === "select" &&
      !field.options.some((option) => option.value === value)
    ) {
      errors[field.name] = `${field.label}の選択肢が正しくありません。`;
    }
  }

  return errors;
}
