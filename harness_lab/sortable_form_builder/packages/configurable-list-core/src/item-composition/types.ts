import type {
  DetailLayoutDefinition,
  MarkdownSanitizationChange,
} from "../detail-layout";
import type {
  BoundaryFilterResult,
  BoundaryIssue,
  JsonInputBoundaryIssueCode,
  JsonInputBoundaryMetadata,
  JsonInputBoundaryPolicy,
} from "../input-boundary";
import type { FieldDefinition } from "../types";

export interface ItemCompositionPolicy extends JsonInputBoundaryPolicy {
  maxFields: number;
  maxFieldNameCharacters: number;
  maxLabelCharacters: number;
  maxDescriptionCharacters: number;
  maxOptions: number;
  maxDefaultValueCharacters: number;
  maxPlaceholderCharacters: number;
  maxOptionValueCharacters: number;
  maxOptionLabelCharacters: number;
  maxInitialTitleCharacters: number;
}

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
  | JsonInputBoundaryIssueCode
  | "invalid_schema_version"
  | "invalid_structure"
  | "unknown_property"
  | "limit_exceeded"
  | "duplicate_field_name"
  | "invalid_field_definition"
  | "invalid_field_reference"
  | "invalid_detail_layout";

export type ItemCompositionIssue = BoundaryIssue<ItemCompositionIssueCode>;

export type ItemCompositionFilterResult =
  BoundaryFilterResult<
    ItemCompositionDefinition,
    ItemCompositionIssue,
    {
      boundary: JsonInputBoundaryMetadata;
      sanitizationChanges: ReadonlyArray<MarkdownSanitizationChange>;
    }
  >;
