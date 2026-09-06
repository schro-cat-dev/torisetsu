import policyContract from "../../contracts/item-composition.policy.json";
import { filterDetailLayoutConfig } from "../detail-layout";
import type {
  CollectionDefinition,
  ConfigurableItem,
  FieldDefinition,
  FieldValue,
} from "../types";
import type {
  ItemCompositionDefinition,
  ItemCompositionFilterResult,
  ItemCompositionIssue,
  ItemCompositionIssueCode,
} from "./types";

type UnknownRecord = Record<string, unknown>;

export const DEFAULT_ITEM_COMPOSITION_POLICY = Object.freeze({
  ...policyContract.limits,
  acceptedDocumentFormats: Object.freeze([
    ...policyContract.acceptedDocumentFormats,
  ]),
});

const FIELD_NAME_PATTERN = /^[a-z][a-z0-9._-]{0,63}$/i;
const UNSAFE_PROPERTY_NAMES = new Set(["__proto__", "prototype", "constructor"]);

function issue(
  code: ItemCompositionIssueCode,
  path: string,
  message: string,
): ItemCompositionIssue {
  return { code, path, message };
}

function isRecord(value: unknown): value is UnknownRecord {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function findUnsafeProperty(value: unknown) {
  const pending: Array<{ value: unknown; path: string }> = [{ value, path: "$" }];
  const seen = new Set<object>();

  while (pending.length > 0) {
    const current = pending.pop();
    if (
      !current ||
      typeof current.value !== "object" ||
      current.value === null ||
      seen.has(current.value)
    ) {
      continue;
    }
    seen.add(current.value);

    for (const [key, child] of Object.entries(current.value)) {
      const childPath = Array.isArray(current.value)
        ? `${current.path}[${key}]`
        : `${current.path}.${key}`;
      if (UNSAFE_PROPERTY_NAMES.has(key)) {
        return childPath;
      }
      pending.push({ value: child, path: childPath });
    }
  }

  return null;
}

function rejectUnknownProperties(
  value: UnknownRecord,
  allowed: ReadonlySet<string>,
  path: string,
  issues: ItemCompositionIssue[],
) {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      issues.push(
        issue("unknown_property", `${path}.${key}`, `未対応のpropertyです: ${key}`),
      );
    }
  }
}

function parseDocument(input: unknown) {
  if (typeof input !== "string") {
    return { value: input, issues: [] as ItemCompositionIssue[] };
  }
  if (input.length > policyContract.limits.maxDocumentCharacters) {
    return {
      value: null,
      issues: [
        issue(
          "document_too_large",
          "$",
          `JSON文書は${policyContract.limits.maxDocumentCharacters}文字以内にしてください`,
        ),
      ],
    };
  }

  const trimmed = input.trim();
  const fencedMatch = trimmed.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?```$/i);
  const format = fencedMatch ? "markdown-json-fence" : "json";
  if (!policyContract.acceptedDocumentFormats.includes(format)) {
    return {
      value: null,
      issues: [
        issue("unsupported_document_format", "$", `未対応の入力形式です: ${format}`),
      ],
    };
  }

  try {
    return {
      value: JSON.parse(fencedMatch?.[1] ?? trimmed) as unknown,
      issues: [] as ItemCompositionIssue[],
    };
  } catch {
    return {
      value: null,
      issues: [issue("invalid_json", "$", "有効なJSON文書ではありません")],
    };
  }
}

function readOptionalString(
  value: unknown,
  path: string,
  maxLength: number,
  issues: ItemCompositionIssue[],
) {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || value.length > maxLength) {
    issues.push(
      issue(
        "invalid_field_definition",
        path,
        `${maxLength}文字以内の文字列で指定してください`,
      ),
    );
    return undefined;
  }
  return value;
}

function readOptionalBoolean(
  value: unknown,
  path: string,
  issues: ItemCompositionIssue[],
) {
  if (value === undefined) return undefined;
  if (typeof value !== "boolean") {
    issues.push(issue("invalid_field_definition", path, "booleanで指定してください"));
    return undefined;
  }
  return value;
}

function readOptionalNumber(
  value: unknown,
  path: string,
  issues: ItemCompositionIssue[],
) {
  if (value === undefined) return undefined;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    issues.push(issue("invalid_field_definition", path, "有限のnumberで指定してください"));
    return undefined;
  }
  return value;
}

function readFieldDefinition(
  value: unknown,
  index: number,
  issues: ItemCompositionIssue[],
): FieldDefinition | null {
  const path = `$.fields[${index}]`;
  if (!isRecord(value)) {
    issues.push(issue("invalid_field_definition", path, "fieldはobjectです"));
    return null;
  }

  if (
    typeof value.name !== "string" ||
    value.name.length > policyContract.limits.maxFieldNameCharacters ||
    !FIELD_NAME_PATTERN.test(value.name)
  ) {
    issues.push(
      issue(
        "invalid_field_definition",
        `${path}.name`,
        "nameは英字で始まる64文字以内の英数字・記号._-で指定してください",
      ),
    );
    return null;
  }
  if (
    typeof value.label !== "string" ||
    value.label.length === 0 ||
    value.label.length > policyContract.limits.maxLabelCharacters
  ) {
    issues.push(
      issue(
        "invalid_field_definition",
        `${path}.label`,
        `labelは1文字以上${policyContract.limits.maxLabelCharacters}文字以内です`,
      ),
    );
    return null;
  }

  const baseAllowed = ["name", "type", "label", "required", "description", "fullWidth"];
  const base = {
    name: value.name,
    label: value.label,
    ...(readOptionalBoolean(value.required, `${path}.required`, issues) === undefined
      ? {}
      : { required: value.required as boolean }),
    ...(readOptionalString(
      value.description,
      `${path}.description`,
      policyContract.limits.maxDescriptionCharacters,
      issues,
    ) === undefined
      ? {}
      : { description: value.description as string }),
    ...(readOptionalBoolean(value.fullWidth, `${path}.fullWidth`, issues) === undefined
      ? {}
      : { fullWidth: value.fullWidth as boolean }),
  };

  if (value.type === "text" || value.type === "textarea") {
    rejectUnknownProperties(
      value,
      new Set([...baseAllowed, "defaultValue", "placeholder", "maxLength"]),
      path,
      issues,
    );
    const maxLength = readOptionalNumber(value.maxLength, `${path}.maxLength`, issues);
    if (maxLength !== undefined && (!Number.isInteger(maxLength) || maxLength < 1)) {
      issues.push(
        issue("invalid_field_definition", `${path}.maxLength`, "1以上の整数です"),
      );
    }
    return {
      ...base,
      type: value.type,
      ...(readOptionalString(value.defaultValue, `${path}.defaultValue`, maxLength ?? 100_000, issues) === undefined
        ? {}
        : { defaultValue: value.defaultValue as string }),
      ...(readOptionalString(value.placeholder, `${path}.placeholder`, 300, issues) === undefined
        ? {}
        : { placeholder: value.placeholder as string }),
      ...(maxLength === undefined ? {} : { maxLength }),
    };
  }

  if (value.type === "number") {
    rejectUnknownProperties(
      value,
      new Set([...baseAllowed, "defaultValue", "min", "max", "step"]),
      path,
      issues,
    );
    const defaultValue = readOptionalNumber(value.defaultValue, `${path}.defaultValue`, issues);
    const min = readOptionalNumber(value.min, `${path}.min`, issues);
    const max = readOptionalNumber(value.max, `${path}.max`, issues);
    const step = readOptionalNumber(value.step, `${path}.step`, issues);
    if (min !== undefined && max !== undefined && min > max) {
      issues.push(issue("invalid_field_definition", path, "minはmax以下にしてください"));
    }
    if (step !== undefined && step <= 0) {
      issues.push(issue("invalid_field_definition", `${path}.step`, "stepは0より大きい値です"));
    }
    if (
      defaultValue !== undefined &&
      ((min !== undefined && defaultValue < min) ||
        (max !== undefined && defaultValue > max))
    ) {
      issues.push(
        issue(
          "invalid_field_definition",
          `${path}.defaultValue`,
          "defaultValueはminからmaxの範囲内にしてください",
        ),
      );
    }
    return {
      ...base,
      type: "number",
      ...(defaultValue === undefined ? {} : { defaultValue }),
      ...(min === undefined ? {} : { min }),
      ...(max === undefined ? {} : { max }),
      ...(step === undefined ? {} : { step }),
    };
  }

  if (value.type === "select") {
    rejectUnknownProperties(
      value,
      new Set([...baseAllowed, "defaultValue", "options"]),
      path,
      issues,
    );
    if (
      !Array.isArray(value.options) ||
      value.options.length === 0 ||
      value.options.length > policyContract.limits.maxOptions
    ) {
      issues.push(
        issue(
          "invalid_field_definition",
          `${path}.options`,
          `optionsは1件以上${policyContract.limits.maxOptions}件以内です`,
        ),
      );
      return null;
    }
    const options: Array<{ value: string; label: string }> = [];
    const optionValues = new Set<string>();
    for (const [optionIndex, option] of value.options.entries()) {
      const optionPath = `${path}.options[${optionIndex}]`;
      if (
        !isRecord(option) ||
        typeof option.value !== "string" ||
        option.value.length === 0 ||
        typeof option.label !== "string" ||
        option.label.length === 0
      ) {
        issues.push(
          issue("invalid_field_definition", optionPath, "valueとlabelが必要です"),
        );
        continue;
      }
      rejectUnknownProperties(option, new Set(["value", "label"]), optionPath, issues);
      if (optionValues.has(option.value)) {
        issues.push(
          issue("invalid_field_definition", `${optionPath}.value`, "valueが重複しています"),
        );
        continue;
      }
      optionValues.add(option.value);
      options.push({ value: option.value, label: option.label });
    }
    const defaultValue = readOptionalString(
      value.defaultValue,
      `${path}.defaultValue`,
      300,
      issues,
    );
    if (defaultValue !== undefined && !optionValues.has(defaultValue)) {
      issues.push(
        issue(
          "invalid_field_definition",
          `${path}.defaultValue`,
          "defaultValueはoptions内のvalueを指定してください",
        ),
      );
    }
    return {
      ...base,
      type: "select",
      options,
      ...(defaultValue === undefined ? {} : { defaultValue }),
    };
  }

  if (value.type === "checkbox") {
    rejectUnknownProperties(
      value,
      new Set([...baseAllowed, "defaultValue"]),
      path,
      issues,
    );
    const defaultValue = readOptionalBoolean(
      value.defaultValue,
      `${path}.defaultValue`,
      issues,
    );
    return {
      ...base,
      type: "checkbox",
      ...(defaultValue === undefined ? {} : { defaultValue }),
    };
  }

  issues.push(
    issue(
      "invalid_field_definition",
      `${path}.type`,
      "typeはtext、textarea、number、select、checkboxのいずれかです",
    ),
  );
  return null;
}

function readFieldReference(
  value: unknown,
  path: string,
  fieldsByName: ReadonlyMap<string, FieldDefinition>,
  issues: ItemCompositionIssue[],
  required: boolean,
) {
  if (value === undefined && !required) return undefined;
  if (typeof value !== "string" || !fieldsByName.has(value)) {
    issues.push(
      issue("invalid_field_reference", path, "fieldsに存在するfield名を指定してください"),
    );
    return undefined;
  }
  return value;
}

export function filterItemCompositionConfig(
  input: unknown,
): ItemCompositionFilterResult {
  const parsed = parseDocument(input);
  if (parsed.issues.length > 0) return { ok: false, issues: parsed.issues };

  const unsafePath = findUnsafeProperty(parsed.value);
  if (unsafePath) {
    return {
      ok: false,
      issues: [issue("unsafe_property", unsafePath, "安全でないproperty名です")],
    };
  }
  if (!isRecord(parsed.value)) {
    return {
      ok: false,
      issues: [issue("invalid_structure", "$", "item compositionはobjectです")],
    };
  }

  const issues: ItemCompositionIssue[] = [];
  rejectUnknownProperties(
    parsed.value,
    new Set(["schemaVersion", "fields", "creation", "display"]),
    "$",
    issues,
  );
  if (parsed.value.schemaVersion !== "configurable-item-composition.v1") {
    issues.push(
      issue(
        "invalid_schema_version",
        "$.schemaVersion",
        "schemaVersionはconfigurable-item-composition.v1です",
      ),
    );
  }
  if (
    !Array.isArray(parsed.value.fields) ||
    parsed.value.fields.length === 0 ||
    parsed.value.fields.length > policyContract.limits.maxFields
  ) {
    issues.push(
      issue(
        "limit_exceeded",
        "$.fields",
        `fieldsは1件以上${policyContract.limits.maxFields}件以内です`,
      ),
    );
    return { ok: false, issues };
  }

  const fields = parsed.value.fields
    .map((field, index) => readFieldDefinition(field, index, issues))
    .filter((field): field is FieldDefinition => field !== null);
  const fieldsByName = new Map(fields.map((field) => [field.name, field]));
  const seenFieldNames = new Set<string>();
  for (const [index, field] of fields.entries()) {
    if (seenFieldNames.has(field.name)) {
      issues.push(
        issue(
          "duplicate_field_name",
          `$.fields[${index}].name`,
          `field名が重複しています: ${field.name}`,
        ),
      );
    }
    seenFieldNames.add(field.name);
  }

  let creation: ItemCompositionDefinition["creation"] | null = null;
  if (!isRecord(parsed.value.creation) || !isRecord(parsed.value.creation.initialTitle)) {
    issues.push(
      issue("invalid_structure", "$.creation.initialTitle", "initialTitleが必要です"),
    );
  } else {
    rejectUnknownProperties(
      parsed.value.creation,
      new Set(["initialTitle"]),
      "$.creation",
      issues,
    );
    rejectUnknownProperties(
      parsed.value.creation.initialTitle,
      new Set(["field", "value"]),
      "$.creation.initialTitle",
      issues,
    );
    const titleField = readFieldReference(
      parsed.value.creation.initialTitle.field,
      "$.creation.initialTitle.field",
      fieldsByName,
      issues,
      true,
    );
    const titleValue = parsed.value.creation.initialTitle.value;
    if (typeof titleValue !== "string") {
      issues.push(
        issue("invalid_structure", "$.creation.initialTitle.value", "valueは文字列です"),
      );
    }
    const fieldDefinition = titleField ? fieldsByName.get(titleField) : undefined;
    if (
      fieldDefinition &&
      fieldDefinition.type !== "text" &&
      fieldDefinition.type !== "textarea"
    ) {
      issues.push(
        issue(
          "invalid_field_reference",
          "$.creation.initialTitle.field",
          "initialTitleにはtextまたはtextarea fieldを指定してください",
        ),
      );
    }
    if (titleField && typeof titleValue === "string") {
      creation = { initialTitle: { field: titleField, value: titleValue } };
    }
  }

  let display: ItemCompositionDefinition["display"] | null = null;
  if (!isRecord(parsed.value.display)) {
    issues.push(issue("invalid_structure", "$.display", "displayはobjectです"));
  } else {
    rejectUnknownProperties(
      parsed.value.display,
      new Set([
        "titleField",
        "summaryField",
        "badgeField",
        "detailFields",
        "detailLayout",
      ]),
      "$.display",
      issues,
    );
    const titleField = readFieldReference(
      parsed.value.display.titleField,
      "$.display.titleField",
      fieldsByName,
      issues,
      true,
    );
    const titleFieldDefinition = titleField
      ? fieldsByName.get(titleField)
      : undefined;
    if (
      titleFieldDefinition &&
      titleFieldDefinition.type !== "text" &&
      titleFieldDefinition.type !== "textarea"
    ) {
      issues.push(
        issue(
          "invalid_field_reference",
          "$.display.titleField",
          "titleFieldにはtextまたはtextarea fieldを指定してください",
        ),
      );
    }
    const summaryField = readFieldReference(
      parsed.value.display.summaryField,
      "$.display.summaryField",
      fieldsByName,
      issues,
      false,
    );
    const badgeField = readFieldReference(
      parsed.value.display.badgeField,
      "$.display.badgeField",
      fieldsByName,
      issues,
      false,
    );
    let detailFields: string[] | undefined;
    if (parsed.value.display.detailFields !== undefined) {
      if (!Array.isArray(parsed.value.display.detailFields)) {
        issues.push(
          issue("invalid_structure", "$.display.detailFields", "arrayで指定してください"),
        );
      } else {
        detailFields = parsed.value.display.detailFields
          .map((fieldName, index) =>
            readFieldReference(
              fieldName,
              `$.display.detailFields[${index}]`,
              fieldsByName,
              issues,
              true,
            ),
          )
          .filter((fieldName): fieldName is string => Boolean(fieldName));
      }
    }
    let detailLayout: ItemCompositionDefinition["display"]["detailLayout"];
    if (parsed.value.display.detailLayout !== undefined) {
      const detailResult = filterDetailLayoutConfig(
        parsed.value.display.detailLayout,
        fields,
      );
      if (!detailResult.ok) {
        issues.push(
          ...detailResult.issues.map((detailIssue) =>
            issue(
              "invalid_detail_layout",
              `$.display.detailLayout${detailIssue.path.slice(1)}`,
              detailIssue.message,
            ),
          ),
        );
      } else {
        detailLayout = detailResult.value;
      }
    }
    if (titleField) {
      display = {
        titleField,
        ...(summaryField ? { summaryField } : {}),
        ...(badgeField ? { badgeField } : {}),
        ...(detailFields ? { detailFields } : {}),
        ...(detailLayout === undefined ? {} : { detailLayout }),
      };
    }
  }

  if (
    issues.length > 0 ||
    fields.length !== parsed.value.fields.length ||
    !creation ||
    !display
  ) {
    return { ok: false, issues };
  }

  return {
    ok: true,
    value: {
      schemaVersion: "configurable-item-composition.v1",
      fields,
      creation,
      display,
    },
    issues: [],
  };
}

function blankValueForField(field: FieldDefinition): FieldValue {
  return field.type === "checkbox" ? false : "";
}

function isCompatibleValue(
  previousField: FieldDefinition,
  nextField: FieldDefinition,
  value: FieldValue | undefined,
) {
  if (
    (previousField.type === "text" || previousField.type === "textarea") &&
    (nextField.type === "text" || nextField.type === "textarea")
  ) {
    return typeof value === "string";
  }
  if (previousField.type !== nextField.type) return false;
  if (nextField.type === "checkbox") return typeof value === "boolean";
  if (nextField.type === "number") {
    return (
      typeof value === "number" &&
      Number.isFinite(value) &&
      (nextField.min === undefined || value >= nextField.min) &&
      (nextField.max === undefined || value <= nextField.max)
    );
  }
  if (nextField.type === "select") {
    return (
      typeof value === "string" &&
      nextField.options.some((option) => option.value === value)
    );
  }
  return false;
}

export function migrateItemsToComposition(
  items: ReadonlyArray<ConfigurableItem>,
  previousFields: ReadonlyArray<FieldDefinition>,
  nextFields: ReadonlyArray<FieldDefinition>,
) {
  const previousFieldsByName = new Map(
    previousFields.map((field) => [field.name, field]),
  );

  return items.map((item) => ({
    id: item.id,
    values: Object.fromEntries(
      nextFields.map((nextField) => {
        const previousField = previousFieldsByName.get(nextField.name);
        const previousValue = item.values[nextField.name];
        return [
          nextField.name,
          previousField && isCompatibleValue(previousField, nextField, previousValue)
            ? previousValue
            : blankValueForField(nextField),
        ];
      }),
    ),
  }));
}

export function applyItemComposition(
  definition: CollectionDefinition,
  composition: ItemCompositionDefinition,
): CollectionDefinition {
  return {
    ...definition,
    fields: composition.fields,
    creation: composition.creation,
    display: composition.display,
  };
}

export function createItemCompositionSnapshot(
  definition: CollectionDefinition,
): ItemCompositionDefinition {
  const detailLayoutResult =
    definition.display.detailLayout === undefined
      ? null
      : filterDetailLayoutConfig(
          definition.display.detailLayout,
          definition.fields,
        );
  return {
    schemaVersion: "configurable-item-composition.v1",
    fields: definition.fields,
    creation: definition.creation,
    display: {
      titleField: definition.display.titleField,
      ...(definition.display.summaryField
        ? { summaryField: definition.display.summaryField }
        : {}),
      ...(definition.display.badgeField
        ? { badgeField: definition.display.badgeField }
        : {}),
      ...(definition.display.detailFields
        ? { detailFields: definition.display.detailFields }
        : {}),
      ...(detailLayoutResult?.ok
        ? { detailLayout: detailLayoutResult.value }
        : {}),
    },
  };
}

export function serializeItemComposition(definition: CollectionDefinition) {
  return JSON.stringify(createItemCompositionSnapshot(definition), null, 2);
}
