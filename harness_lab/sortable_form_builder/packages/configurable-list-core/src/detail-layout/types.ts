import type { FieldValue } from "../types";
import type {
  BoundaryFilterResult,
  BoundaryIssue,
  JsonInputBoundaryIssueCode,
  JsonInputBoundaryMetadata,
  JsonInputBoundaryPolicy,
} from "../input-boundary";
import type { MarkdownSanitizationChange } from "./markdownSanitizer";

export type DetailLayoutSchemaVersion = "configurable-detail-layout.v1";

export interface LiteralMarkdownSource {
    kind: "literal";
    markdown: string;
}

export interface FieldMarkdownSource<FieldName extends string = string> {
    kind: "field";
    field: FieldName;
}

export type MarkdownSource<FieldName extends string = string> =
    | LiteralMarkdownSource
    | FieldMarkdownSource<FieldName>;

export interface MarkdownDetailSection<FieldName extends string = string> {
    id: string;
    type: "markdown";
    title?: string;
    source: MarkdownSource<FieldName>;
}

export interface FieldListDetailSection<FieldName extends string = string> {
    id: string;
    type: "field-list";
    title?: string;
    columns?: 1 | 2;
    fields: ReadonlyArray<FieldName>;
}

export type DetailSectionDefinition<FieldName extends string = string> =
    | MarkdownDetailSection<FieldName>
    | FieldListDetailSection<FieldName>;

export interface DetailLayoutDefinition<FieldName extends string = string> {
    schemaVersion: DetailLayoutSchemaVersion;
    sections: ReadonlyArray<DetailSectionDefinition<FieldName>>;
}

export interface DetailLayoutPolicy extends JsonInputBoundaryPolicy {
    maxSections: number;
    maxSectionTitleCharacters: number;
    maxMarkdownCharacters: number;
    maxFieldsPerSection: number;
    allowedLinkProtocols: ReadonlyArray<string>;
}

export type DetailLayoutIssueCode =
    | JsonInputBoundaryIssueCode
    | "invalid_schema_version"
    | "invalid_structure"
    | "unknown_property"
    | "unknown_section_type"
    | "duplicate_section_id"
    | "invalid_section_id"
    | "invalid_field_reference"
    | "invalid_markdown_source"
    | "limit_exceeded";

export type DetailLayoutIssue = BoundaryIssue<DetailLayoutIssueCode>;

export type DetailLayoutFilterResult<FieldName extends string = string> =
    BoundaryFilterResult<
      DetailLayoutDefinition<FieldName>,
      DetailLayoutIssue,
      {
        boundary: JsonInputBoundaryMetadata;
        sanitizationChanges: ReadonlyArray<MarkdownSanitizationChange>;
      }
    >;

export interface DetailItemValues<FieldName extends string = string> {
    id: string;
    values: Record<FieldName, FieldValue>;
}
