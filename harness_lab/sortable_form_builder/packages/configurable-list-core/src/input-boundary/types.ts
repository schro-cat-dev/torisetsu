export type JsonDocumentFormat = "json" | "markdown-json-fence";

export interface JsonInputBoundaryPolicy {
  acceptedDocumentFormats: ReadonlyArray<JsonDocumentFormat>;
  maxDocumentCharacters: number;
  maxNestingDepth: number;
  maxNodeCount: number;
  maxTotalStringCharacters: number;
}

export type JsonInputBoundaryIssueCode =
  | "document_too_large"
  | "invalid_json"
  | "unsupported_document_format"
  | "invalid_boundary_policy"
  | "invalid_json_value"
  | "cyclic_value"
  | "nesting_too_deep"
  | "node_limit_exceeded"
  | "string_content_too_large"
  | "unsafe_property";

export interface BoundaryIssue<Code extends string = string> {
  code: Code;
  path: string;
  message: string;
}

export interface JsonInputBoundaryMetadata {
  inputKind: "document" | "object";
  documentFormat?: JsonDocumentFormat;
  nodeCount: number;
  totalStringCharacters: number;
  maxDepthObserved: number;
}

export type BoundaryFilterResult<
  Value,
  Issue extends BoundaryIssue,
  SuccessMetadata extends object = Record<never, never>,
> =
  | ({
      ok: true;
      value: Value;
      issues: readonly [];
    } & SuccessMetadata)
  | {
      ok: false;
      issues: ReadonlyArray<Issue>;
    };

export type JsonInputBoundaryIssue = BoundaryIssue<JsonInputBoundaryIssueCode>;

export type JsonInputBoundaryResult = BoundaryFilterResult<
  unknown,
  JsonInputBoundaryIssue,
  JsonInputBoundaryMetadata
>;
