export type FieldValue = string | number | boolean;

export type ItemFieldValues<FieldName extends string = string> = Record<
  FieldName,
  FieldValue
>;

interface BaseFieldDefinition<FieldName extends string> {
  name: FieldName;
  label: string;
  required?: boolean;
  description?: string;
  fullWidth?: boolean;
}

export interface TextFieldDefinition<FieldName extends string = string>
  extends BaseFieldDefinition<FieldName> {
  type: "text" | "textarea";
  defaultValue?: string;
  placeholder?: string;
  maxLength?: number;
}

export interface NumberFieldDefinition<FieldName extends string = string>
  extends BaseFieldDefinition<FieldName> {
  type: "number";
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
}

export interface SelectFieldDefinition<FieldName extends string = string>
  extends BaseFieldDefinition<FieldName> {
  type: "select";
  defaultValue?: string;
  options: ReadonlyArray<{
    value: string;
    label: string;
  }>;
}

export interface CheckboxFieldDefinition<FieldName extends string = string>
  extends BaseFieldDefinition<FieldName> {
  type: "checkbox";
  defaultValue?: boolean;
}

export type FieldDefinition<FieldName extends string = string> =
  | TextFieldDefinition<FieldName>
  | NumberFieldDefinition<FieldName>
  | SelectFieldDefinition<FieldName>
  | CheckboxFieldDefinition<FieldName>;

export interface ConfigurableItem<FieldName extends string = string> {
  id: string;
  values: ItemFieldValues<FieldName>;
}

export interface CollectionDefinition<FieldName extends string = string> {
  schemaVersion: "configurable-collection.v1";
  id: string;
  label: string;
  itemLabel: string;
  fields: ReadonlyArray<FieldDefinition<FieldName>>;
  creation: {
    initialTitle: {
      field: FieldName;
      value: string;
    };
  };
  display: {
    titleField: FieldName;
    summaryField?: FieldName;
    badgeField?: FieldName;
    detailFields?: ReadonlyArray<FieldName>;
    detailLayout?: unknown;
  };
}

export type FieldErrors<FieldName extends string = string> = Partial<
  Record<FieldName, string>
>;
