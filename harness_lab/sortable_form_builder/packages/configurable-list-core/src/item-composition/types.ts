import type { DetailLayoutDefinition } from "../detail-layout";
import type { FieldDefinition } from "../types";

export interface ItemCompositionDefinition<FieldName extends string = string> {
  schemaVersion: "configurable-item-composition.v1";
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
    detailLayout?: DetailLayoutDefinition<FieldName>;
  };
}

export type ItemCompositionIssueCode =
  | "document_too_large"
  | "invalid_json"
  | "unsupported_document_format"
  | "invalid_schema_version"
  | "invalid_structure"
  | "unknown_property"
  | "unsafe_property"
  | "limit_exceeded"
  | "duplicate_field_name"
  | "invalid_field_definition"
  | "invalid_field_reference"
  | "invalid_detail_layout";

export interface ItemCompositionIssue {
  code: ItemCompositionIssueCode;
  path: string;
  message: string;
}

export type ItemCompositionFilterResult =
  | {
      ok: true;
      value: ItemCompositionDefinition;
      issues: readonly [];
    }
  | {
      ok: false;
      issues: ReadonlyArray<ItemCompositionIssue>;
    };
