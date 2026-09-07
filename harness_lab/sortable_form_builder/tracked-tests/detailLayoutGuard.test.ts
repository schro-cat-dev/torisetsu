import { describe, expect, it } from "vitest";
import {
  DEFAULT_DETAIL_LAYOUT_POLICY,
  filterDetailLayoutConfig,
  sanitizeMarkdownForDisplay,
  type FieldDefinition,
} from "@torisetsu/configurable-list";
import policyContract from "../packages/configurable-list-core/contracts/detail-layout.policy.json";

const fields = [
  { name: "title", type: "text", label: "タイトル" },
  { name: "notes", type: "textarea", label: "メモ" },
  { name: "count", type: "number", label: "件数" },
] satisfies ReadonlyArray<FieldDefinition>;

const validLayout = {
  schemaVersion: "configurable-detail-layout.v1",
  sections: [
    {
      id: "summary",
      type: "field-list",
      fields: ["title", "count"],
      columns: 2,
    },
    {
      id: "notes",
      type: "markdown",
      source: { kind: "field", field: "notes" },
    },
  ],
};

describe("filterDetailLayoutConfig", () => {
  it("sanitizes literal markdown before returning the safe layout", () => {
    const result = filterDetailLayoutConfig(
      {
        schemaVersion: "configurable-detail-layout.v1",
        sections: [
          {
            id: "safe-notes",
            type: "markdown",
            source: {
              kind: "literal",
              markdown:
                "**残す文章**\n\n<script>alert('x')</script>\n\n[危険](javascript:alert('x'))\n\n![外部画像](https://example.com/a.png)",
            },
          },
        ],
      },
      fields,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      const section = result.value.sections[0];
      expect(section.type).toBe("markdown");
      if (section.type === "markdown" && section.source.kind === "literal") {
        expect(section.source.markdown).toContain("**残す文章**");
        expect(section.source.markdown).not.toContain("<script");
        expect(section.source.markdown).not.toContain("javascript:");
        expect(section.source.markdown).not.toContain("https://example.com/a.png");
      }
    }
  });

  it("returns a sanitization record for removed markdown content", () => {
    const result = sanitizeMarkdownForDisplay(
      "本文<script>削除</script>[危険](javascript:alert('x'))",
      DEFAULT_DETAIL_LAYOUT_POLICY,
    );

    expect(result.markdown).toContain("本文");
    expect(result.markdown).not.toContain("<script");
    expect(result.markdown).not.toContain("javascript:");
    expect(result.changes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "raw_html_removed" }),
        expect.objectContaining({ code: "unsafe_link_removed" }),
      ]),
    );
  });

  it("uses the shared policy contract as its default limits", () => {
    expect(DEFAULT_DETAIL_LAYOUT_POLICY).toEqual({
      acceptedDocumentFormats: policyContract.acceptedDocumentFormats,
      maxDocumentCharacters: policyContract.limits.maxDocumentCharacters,
      maxSections: policyContract.limits.maxSections,
      maxSectionTitleCharacters:
        policyContract.limits.maxSectionTitleCharacters,
      maxMarkdownCharacters: policyContract.limits.maxMarkdownCharacters,
      maxFieldsPerSection: policyContract.limits.maxFieldsPerSection,
      maxNestingDepth: policyContract.limits.maxNestingDepth,
      maxNodeCount: policyContract.limits.maxNodeCount,
      maxTotalStringCharacters:
        policyContract.limits.maxTotalStringCharacters,
      allowedLinkProtocols: policyContract.allowedLinkProtocols,
    });
  });

  it("accepts and normalizes a valid object", () => {
    const result = filterDetailLayoutConfig(validLayout, fields);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.sections).toHaveLength(2);
      expect(result.value.sections[0]).toMatchObject({
        id: "summary",
        type: "field-list",
        columns: 2,
      });
    }
  });

  it("returns the same normalized value without mutating the input", () => {
    const input = structuredClone(validLayout);
    const before = structuredClone(input);

    const first = filterDetailLayoutConfig(input, fields);
    const second = filterDetailLayoutConfig(input, fields);

    expect(input).toEqual(before);
    expect(first).toEqual(second);
  });

  it("rejects malformed JSON and unknown root properties", () => {
    expect(filterDetailLayoutConfig('{"schemaVersion":', fields)).toMatchObject({
      ok: false,
      issues: [expect.objectContaining({ code: "invalid_json", path: "$" })],
    });

    expect(
      filterDetailLayoutConfig(
        { ...validLayout, unexpected: true },
        fields,
      ),
    ).toMatchObject({
      ok: false,
      issues: [
        expect.objectContaining({
          code: "unknown_property",
          path: "$.unexpected",
        }),
      ],
    });
  });

  it("accepts a JSON document wrapped in one markdown code fence", () => {
    const input = `\`\`\`json\n${JSON.stringify(validLayout)}\n\`\`\``;
    const result = filterDetailLayoutConfig(input, fields);

    expect(result.ok).toBe(true);
  });

  it("rejects a document format disabled by policy", () => {
    const input = `\`\`\`json\n${JSON.stringify(validLayout)}\n\`\`\``;
    const result = filterDetailLayoutConfig(input, fields, {
      ...DEFAULT_DETAIL_LAYOUT_POLICY,
      acceptedDocumentFormats: ["json"],
    });

    expect(result).toMatchObject({
      ok: false,
      issues: [
        expect.objectContaining({ code: "unsupported_document_format" }),
      ],
    });
  });

  it("uses policy protocols while sanitizing markdown links", () => {
    const result = sanitizeMarkdownForDisplay(
      "[HTTPS](https://example.com) [MAIL](mailto:test@example.com)",
      {
        ...DEFAULT_DETAIL_LAYOUT_POLICY,
        allowedLinkProtocols: ["https"],
      },
    );

    expect(result.markdown).toContain("https://example.com");
    expect(result.markdown).not.toContain("mailto:");
    expect(result.changes).toContainEqual({
      code: "unsafe_link_removed",
      count: 1,
    });
  });

  it("rejects unknown section types instead of ignoring them", () => {
    const result = filterDetailLayoutConfig(
      {
        schemaVersion: "configurable-detail-layout.v1",
        sections: [{ id: "custom", type: "script", source: {} }],
      },
      fields,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues).toContainEqual(
        expect.objectContaining({ code: "unknown_section_type" }),
      );
    }
  });

  it("rejects field references that are not declared by the collection", () => {
    const result = filterDetailLayoutConfig(
      {
        schemaVersion: "configurable-detail-layout.v1",
        sections: [
          { id: "missing", type: "field-list", fields: ["missingField"] },
        ],
      },
      fields,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          code: "invalid_field_reference",
          path: "$.sections[0].fields[0]",
        }),
      );
    }
  });

  it("rejects non-text fields as markdown sources", () => {
    const result = filterDetailLayoutConfig(
      {
        schemaVersion: "configurable-detail-layout.v1",
        sections: [
          {
            id: "count",
            type: "markdown",
            source: { kind: "field", field: "count" },
          },
        ],
      },
      fields,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues).toContainEqual(
        expect.objectContaining({ code: "invalid_markdown_source" }),
      );
    }
  });

  it("rejects unsafe property names in parsed JSON", () => {
    const result = filterDetailLayoutConfig(
      '{"schemaVersion":"configurable-detail-layout.v1","sections":[],"__proto__":{}}',
      fields,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues).toContainEqual(
        expect.objectContaining({ code: "unsafe_property", path: "$.__proto__" }),
      );
    }
  });

  it("accepts the section-count boundary and rejects the next value", () => {
    const makeSections = (count: number) =>
      Array.from({ length: count }, (_, index) => ({
        id: `section-${index}`,
        type: "field-list",
        fields: ["title"],
      }));

    expect(
      filterDetailLayoutConfig(
        {
          schemaVersion: "configurable-detail-layout.v1",
          sections: makeSections(DEFAULT_DETAIL_LAYOUT_POLICY.maxSections - 1),
        },
        fields,
      ),
    ).toMatchObject({ ok: true });

    expect(
      filterDetailLayoutConfig(
        {
          schemaVersion: "configurable-detail-layout.v1",
          sections: makeSections(DEFAULT_DETAIL_LAYOUT_POLICY.maxSections),
        },
        fields,
      ),
    ).toMatchObject({ ok: true });

    const overLimit = filterDetailLayoutConfig(
      {
        schemaVersion: "configurable-detail-layout.v1",
        sections: makeSections(DEFAULT_DETAIL_LAYOUT_POLICY.maxSections + 1),
      },
      fields,
    );
    expect(overLimit).toMatchObject({
      ok: false,
      issues: [expect.objectContaining({ code: "limit_exceeded", path: "$.sections" })],
    });
  });

  it("reports duplicate section IDs without rendering a partial layout", () => {
    const result = filterDetailLayoutConfig(
      {
        schemaVersion: "configurable-detail-layout.v1",
        sections: [
          { id: "same", type: "field-list", fields: ["title"] },
          { id: "same", type: "field-list", fields: ["notes"] },
        ],
      },
      fields,
    );

    expect(result).toMatchObject({
      ok: false,
      issues: [
        expect.objectContaining({
          code: "duplicate_section_id",
          path: "$.sections[1].id",
        }),
      ],
    });
  });

  it("rejects input nested beyond the shared policy limit", () => {
    let nested: Record<string, unknown> = { value: "end" };
    for (let depth = 0; depth <= DEFAULT_DETAIL_LAYOUT_POLICY.maxNestingDepth; depth += 1) {
      nested = { child: nested };
    }

    const result = filterDetailLayoutConfig(
      {
        schemaVersion: "configurable-detail-layout.v1",
        sections: [
          {
            id: "notes",
            type: "markdown",
            source: { kind: "literal", markdown: "ok", nested },
          },
        ],
      },
      fields,
    );

    expect(result).toMatchObject({
      ok: false,
      issues: [expect.objectContaining({ code: "nesting_too_deep" })],
    });
  });
});
