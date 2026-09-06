import type { FieldValue } from "../types";

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

export interface DetailLayoutPolicy {
    acceptedDocumentFormats: ReadonlyArray<"json" | "markdown-json-fence">;
    maxDocumentCharacters: number;
    maxSections: number;
    maxSectionTitleCharacters: number;
    maxMarkdownCharacters: number;
    maxFieldsPerSection: number;
    maxNestingDepth: number;
    allowedLinkProtocols: ReadonlyArray<string>;
}

export type DetailLayoutIssueCode =
    | "document_too_large"
    | "invalid_json"
    | "unsupported_document_format"
    | "invalid_schema_version"
    | "invalid_structure"
    | "unknown_property"
    | "unknown_section_type"
    | "duplicate_section_id"
    | "invalid_section_id"
    | "invalid_field_reference"
    | "invalid_markdown_source"
    | "limit_exceeded"
    | "nesting_too_deep"
    | "unsafe_property";

export interface DetailLayoutIssue {
    code: DetailLayoutIssueCode;
    path: string;
    message: string;
}

export type DetailLayoutFilterResult<FieldName extends string = string> =
    | {
          ok: true;
          value: DetailLayoutDefinition<FieldName>;
          issues: readonly [];
          sanitizationChanges: ReadonlyArray<{
              code: string;
              count: number;
          }>;
      }
    | {
          ok: false;
          issues: ReadonlyArray<DetailLayoutIssue>;
      };

export interface DetailItemValues<FieldName extends string = string> {
    id: string;
    values: Record<FieldName, FieldValue>;
}
