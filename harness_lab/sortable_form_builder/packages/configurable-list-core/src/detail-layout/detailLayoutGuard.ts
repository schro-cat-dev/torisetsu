import type { FieldDefinition } from "../types";
import { filterJsonInputAtBoundary } from "../input-boundary";
import policyContract from "../../contracts/detail-layout.policy.json";
import {
  sanitizeMarkdownForDisplay,
  type MarkdownSanitizationChange,
} from "./markdownSanitizer";
import type {
  DetailLayoutDefinition,
  DetailLayoutFilterResult,
  DetailLayoutIssue,
  DetailLayoutPolicy,
  DetailSectionDefinition,
  FieldListDetailSection,
  MarkdownDetailSection,
  MarkdownSource,
} from "./types";

export const DEFAULT_DETAIL_LAYOUT_POLICY: Readonly<DetailLayoutPolicy> =
  Object.freeze({
    ...policyContract.limits,
    acceptedDocumentFormats: Object.freeze([
      ...policyContract.acceptedDocumentFormats,
    ]) as DetailLayoutPolicy["acceptedDocumentFormats"],
    allowedLinkProtocols: Object.freeze([...policyContract.allowedLinkProtocols]),
  });

const SECTION_ID_PATTERN = /^[a-z][a-z0-9._-]{0,63}$/i;
const SAFE_LINK_PROTOCOLS = new Set(["http", "https", "mailto"]);
type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function issue(
  code: DetailLayoutIssue["code"],
  path: string,
  message: string,
): DetailLayoutIssue {
  return { code, path, message };
}

function validateDetailLayoutPolicy(
  policy: DetailLayoutPolicy,
): DetailLayoutIssue | null {
  const positiveIntegerKeys = [
    "maxSections",
    "maxSectionTitleCharacters",
    "maxMarkdownCharacters",
    "maxFieldsPerSection",
  ] as const;
  for (const key of positiveIntegerKeys) {
    if (!Number.isSafeInteger(policy[key]) || policy[key] < 1) {
      return issue(
        "invalid_boundary_policy",
        `$.policy.${key}`,
        `${key}は1以上の安全な整数で指定してください`,
      );
    }
  }

  if (
    !Array.isArray(policy.allowedLinkProtocols) ||
    policy.allowedLinkProtocols.some(
      (protocol) => !SAFE_LINK_PROTOCOLS.has(protocol),
    )
  ) {
    return issue(
      "invalid_boundary_policy",
      "$.policy.allowedLinkProtocols",
      "link protocolはhttp、https、mailtoだけを指定できます",
    );
  }
  return null;
}

function rejectUnknownProperties(
  value: UnknownRecord,
  allowedProperties: ReadonlySet<string>,
  path: string,
  issues: DetailLayoutIssue[],
) {
  for (const property of Object.keys(value)) {
    if (!allowedProperties.has(property)) {
      issues.push(
        issue(
          "unknown_property",
          `${path}.${property}`,
          `未対応のpropertyです: ${property}`,
        ),
      );
    }
  }
}

function readOptionalTitle(
  section: UnknownRecord,
  path: string,
  policy: DetailLayoutPolicy,
  issues: DetailLayoutIssue[],
) {
  if (section.title === undefined) {
    return undefined;
  }

  if (
    typeof section.title !== "string" ||
    section.title.length === 0 ||
    section.title.length > policy.maxSectionTitleCharacters
  ) {
    issues.push(
      issue(
        "limit_exceeded",
        `${path}.title`,
        `titleは1文字以上${policy.maxSectionTitleCharacters}文字以内にしてください`,
      ),
    );
    return undefined;
  }

  return section.title;
}

function readMarkdownSource<FieldName extends string>(
  value: unknown,
  path: string,
  fieldsByName: ReadonlyMap<FieldName, FieldDefinition<FieldName>>,
  policy: DetailLayoutPolicy,
  issues: DetailLayoutIssue[],
  sanitizationChanges: MarkdownSanitizationChange[],
): MarkdownSource<FieldName> | null {
  if (!isRecord(value)) {
    issues.push(
      issue("invalid_markdown_source", path, "sourceはobjectで指定してください"),
    );
    return null;
  }

  if (value.kind === "literal") {
    rejectUnknownProperties(value, new Set(["kind", "markdown"]), path, issues);
    if (
      typeof value.markdown !== "string" ||
      value.markdown.length > policy.maxMarkdownCharacters
    ) {
      issues.push(
        issue(
          "limit_exceeded",
          `${path}.markdown`,
          `Markdownは${policy.maxMarkdownCharacters}文字以内にしてください`,
        ),
      );
      return null;
    }
    const sanitized = sanitizeMarkdownForDisplay(value.markdown, policy);
    sanitizationChanges.push(...sanitized.changes);
    return { kind: "literal", markdown: sanitized.markdown };
  }

  if (value.kind === "field") {
    rejectUnknownProperties(value, new Set(["kind", "field"]), path, issues);
    if (typeof value.field !== "string" || !fieldsByName.has(value.field as FieldName)) {
      issues.push(
        issue(
          "invalid_field_reference",
          `${path}.field`,
          "fieldsに存在するfield名を指定してください",
        ),
      );
      return null;
    }

    const field = fieldsByName.get(value.field as FieldName);
    if (field?.type !== "text" && field?.type !== "textarea") {
      issues.push(
        issue(
          "invalid_markdown_source",
          `${path}.field`,
          "Markdown sourceにはtextまたはtextarea fieldを指定してください",
        ),
      );
      return null;
    }
    return { kind: "field", field: value.field as FieldName };
  }

  issues.push(
    issue(
      "invalid_markdown_source",
      `${path}.kind`,
      "source.kindはliteralまたはfieldを指定してください",
    ),
  );
  return null;
}

function readSection<FieldName extends string>(
  value: unknown,
  index: number,
  fieldsByName: ReadonlyMap<FieldName, FieldDefinition<FieldName>>,
  policy: DetailLayoutPolicy,
  issues: DetailLayoutIssue[],
  sanitizationChanges: MarkdownSanitizationChange[],
): DetailSectionDefinition<FieldName> | null {
  const path = `$.sections[${index}]`;
  if (!isRecord(value)) {
    issues.push(issue("invalid_structure", path, "sectionはobjectで指定してください"));
    return null;
  }

  if (typeof value.id !== "string" || !SECTION_ID_PATTERN.test(value.id)) {
    issues.push(
      issue(
        "invalid_section_id",
        `${path}.id`,
        "idは英字で始まる64文字以内の英数字・記号._-で指定してください",
      ),
    );
    return null;
  }

  const title = readOptionalTitle(value, path, policy, issues);

  if (value.type === "markdown") {
    rejectUnknownProperties(value, new Set(["id", "type", "title", "source"]), path, issues);
    const source = readMarkdownSource(
      value.source,
      `${path}.source`,
      fieldsByName,
      policy,
      issues,
      sanitizationChanges,
    );
    if (!source) {
      return null;
    }

    const section: MarkdownDetailSection<FieldName> = {
      id: value.id,
      type: "markdown",
      source,
      ...(title ? { title } : {}),
    };
    return section;
  }

  if (value.type === "field-list") {
    rejectUnknownProperties(value, new Set(["id", "type", "title", "columns", "fields"]), path, issues);
    if (
      !Array.isArray(value.fields) ||
      value.fields.length === 0 ||
      value.fields.length > policy.maxFieldsPerSection
    ) {
      issues.push(
        issue(
          "limit_exceeded",
          `${path}.fields`,
          `fieldsは1件以上${policy.maxFieldsPerSection}件以内にしてください`,
        ),
      );
      return null;
    }

    const fieldNames: FieldName[] = [];
    for (const [fieldIndex, fieldName] of value.fields.entries()) {
      if (typeof fieldName !== "string" || !fieldsByName.has(fieldName as FieldName)) {
        issues.push(
          issue(
            "invalid_field_reference",
            `${path}.fields[${fieldIndex}]`,
            "fieldsに存在するfield名を指定してください",
          ),
        );
        continue;
      }
      fieldNames.push(fieldName as FieldName);
    }

    if (value.columns !== undefined && value.columns !== 1 && value.columns !== 2) {
      issues.push(
        issue("invalid_structure", `${path}.columns`, "columnsは1または2です"),
      );
    }

    if (fieldNames.length !== value.fields.length) {
      return null;
    }

    const section: FieldListDetailSection<FieldName> = {
      id: value.id,
      type: "field-list",
      fields: fieldNames,
      columns: value.columns === 2 ? 2 : 1,
      ...(title ? { title } : {}),
    };
    return section;
  }

  issues.push(
    issue(
      "unknown_section_type",
      `${path}.type`,
      "typeはmarkdownまたはfield-listを指定してください",
    ),
  );
  return null;
}

export function filterDetailLayoutConfig<FieldName extends string>(
  input: unknown,
  fields: ReadonlyArray<FieldDefinition<FieldName>>,
  policy: DetailLayoutPolicy = DEFAULT_DETAIL_LAYOUT_POLICY,
): DetailLayoutFilterResult<FieldName> {
  const policyIssue = validateDetailLayoutPolicy(policy);
  if (policyIssue) return { ok: false, issues: [policyIssue] };

  const boundaryResult = filterJsonInputAtBoundary(input, policy);
  if (!boundaryResult.ok) return { ok: false, issues: boundaryResult.issues };

  if (!isRecord(boundaryResult.value)) {
    return {
      ok: false,
      issues: [issue("invalid_structure", "$", "detail layoutはobjectです")],
    };
  }

  const issues: DetailLayoutIssue[] = [];
  rejectUnknownProperties(
    boundaryResult.value,
    new Set(["schemaVersion", "sections"]),
    "$",
    issues,
  );

  if (boundaryResult.value.schemaVersion !== "configurable-detail-layout.v1") {
    issues.push(
      issue(
        "invalid_schema_version",
        "$.schemaVersion",
        "schemaVersionはconfigurable-detail-layout.v1です",
      ),
    );
  }

  if (
    !Array.isArray(boundaryResult.value.sections) ||
    boundaryResult.value.sections.length === 0 ||
    boundaryResult.value.sections.length > policy.maxSections
  ) {
    issues.push(
      issue(
        "limit_exceeded",
        "$.sections",
        `sectionsは1件以上${policy.maxSections}件以内にしてください`,
      ),
    );
    return { ok: false, issues };
  }

  const fieldsByName = new Map(fields.map((field) => [field.name, field]));
  const sanitizationChanges: MarkdownSanitizationChange[] = [];
  const sections = boundaryResult.value.sections
    .map((section, index) =>
      readSection(
        section,
        index,
        fieldsByName,
        policy,
        issues,
        sanitizationChanges,
      ),
    )
    .filter(
      (section): section is DetailSectionDefinition<FieldName> => section !== null,
    );

  const sectionIds = new Set<string>();
  for (const [index, section] of sections.entries()) {
    if (sectionIds.has(section.id)) {
      issues.push(
        issue(
          "duplicate_section_id",
          `$.sections[${index}].id`,
          `section idが重複しています: ${section.id}`,
        ),
      );
    }
    sectionIds.add(section.id);
  }

  if (issues.length > 0 || sections.length !== boundaryResult.value.sections.length) {
    return { ok: false, issues };
  }

  const value: DetailLayoutDefinition<FieldName> = {
    schemaVersion: "configurable-detail-layout.v1",
    sections,
  };
  return {
    ok: true,
    value,
    issues: [],
    boundary: {
      inputKind: boundaryResult.inputKind,
      ...(boundaryResult.documentFormat
        ? { documentFormat: boundaryResult.documentFormat }
        : {}),
      nodeCount: boundaryResult.nodeCount,
      totalStringCharacters: boundaryResult.totalStringCharacters,
      maxDepthObserved: boundaryResult.maxDepthObserved,
    },
    sanitizationChanges,
  };
}
