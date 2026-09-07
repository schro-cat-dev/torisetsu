import { describe, expect, it } from "vitest";
import detailPolicyContract from "../contracts/detail-layout.policy.json";
import compositionPolicyContract from "../contracts/item-composition.policy.json";
import compositionSchema from "../contracts/item-composition.schema.json";
import {
  DEFAULT_ITEM_COMPOSITION_POLICY,
  DEFAULT_DETAIL_LAYOUT_POLICY,
  InputBoundaryRejectedError,
  createInputBoundaryAdapter,
  filterItemCompositionConfig,
  filterDetailLayoutConfig,
  filterJsonInputAtBoundary,
  type JsonInputBoundaryPolicy,
} from "../src";

const boundaryPolicy: JsonInputBoundaryPolicy = {
  acceptedDocumentFormats: ["json", "markdown-json-fence"],
  maxDocumentCharacters: 1_000,
  maxNestingDepth: 4,
  maxNodeCount: 20,
  maxTotalStringCharacters: 200,
};

const composition = {
  schemaVersion: "configurable-item-composition.v1",
  fields: [{ name: "notes", type: "textarea", label: "メモ" }],
  creation: {
    initialTitle: { field: "notes", value: "新しい項目" },
  },
  display: {
    titleField: "notes",
    detailLayout: {
      schemaVersion: "configurable-detail-layout.v1",
      sections: [
        {
          id: "notes",
          type: "markdown",
          source: {
            kind: "literal",
            markdown: "本文<script>削除</script>",
          },
        },
      ],
    },
  },
};

describe("filterJsonInputAtBoundary", () => {
  it("normalizes plain objects and fenced JSON through one public boundary", () => {
    const objectResult = filterJsonInputAtBoundary({ value: [1, "two"] }, boundaryPolicy);
    const fencedResult = filterJsonInputAtBoundary(
      '```json\n{"value":[1,"two"]}\n```',
      boundaryPolicy,
    );

    expect(objectResult).toMatchObject({
      ok: true,
      value: { value: [1, "two"] },
      inputKind: "object",
    });
    expect(fencedResult).toMatchObject({
      ok: true,
      value: { value: [1, "two"] },
      inputKind: "document",
      documentFormat: "markdown-json-fence",
    });
  });

  it("rejects object input that exceeds the node-count boundary", () => {
    const result = filterJsonInputAtBoundary(
      { values: [1, 2, 3, 4] },
      { ...boundaryPolicy, maxNodeCount: 4 },
    );

    expect(result).toMatchObject({
      ok: false,
      issues: [expect.objectContaining({ code: "node_limit_exceeded" })],
    });
  });

  it("accepts the node-count boundary and rejects the next node", () => {
    const input = { values: [1, 2] };

    expect(
      filterJsonInputAtBoundary(input, { ...boundaryPolicy, maxNodeCount: 4 }),
    ).toMatchObject({ ok: true, nodeCount: 4 });
    expect(
      filterJsonInputAtBoundary(input, { ...boundaryPolicy, maxNodeCount: 3 }),
    ).toMatchObject({
      ok: false,
      issues: [expect.objectContaining({ code: "node_limit_exceeded" })],
    });
  });

  it("rejects object input that exceeds the total string boundary", () => {
    const result = filterJsonInputAtBoundary(
      { value: "1234567890" },
      { ...boundaryPolicy, maxTotalStringCharacters: 10 },
    );

    expect(result).toMatchObject({
      ok: false,
      issues: [expect.objectContaining({ code: "string_content_too_large" })],
    });
  });

  it("rejects invalid policy values instead of weakening the boundary", () => {
    const result = filterJsonInputAtBoundary(
      {},
      { ...boundaryPolicy, maxNestingDepth: -1 },
    );

    expect(result).toMatchObject({
      ok: false,
      issues: [expect.objectContaining({ code: "invalid_boundary_policy" })],
    });
  });

  it("rejects values that cannot exist in JSON", () => {
    const result = filterJsonInputAtBoundary(
      { callback: () => "unsafe" },
      boundaryPolicy,
    );

    expect(result).toMatchObject({
      ok: false,
      issues: [
        expect.objectContaining({
          code: "invalid_json_value",
          path: "$.callback",
        }),
      ],
    });
  });

  it("rejects a cyclic object", () => {
    const input: { self?: unknown } = {};
    input.self = input;

    expect(filterJsonInputAtBoundary(input, boundaryPolicy)).toMatchObject({
      ok: false,
      issues: [expect.objectContaining({ code: "cyclic_value", path: "$.self" })],
    });
  });

  it("rejects an accessor without executing its getter", () => {
    let getterCalled = false;
    const input = {};
    Object.defineProperty(input, "secret", {
      enumerable: true,
      get() {
        getterCalled = true;
        return "value";
      },
    });

    expect(filterJsonInputAtBoundary(input, boundaryPolicy)).toMatchObject({
      ok: false,
      issues: [expect.objectContaining({ code: "invalid_json_value" })],
    });
    expect(getterCalled).toBe(false);
  });

  it("accepts the nesting boundary and rejects the next depth", () => {
    const atBoundary = { first: { second: "value" } };
    const overBoundary = { first: { second: { third: "value" } } };
    const policy = { ...boundaryPolicy, maxNestingDepth: 2 };

    expect(filterJsonInputAtBoundary(atBoundary, policy)).toMatchObject({ ok: true });
    expect(filterJsonInputAtBoundary(overBoundary, policy)).toMatchObject({
      ok: false,
      issues: [expect.objectContaining({ code: "nesting_too_deep" })],
    });
  });

  it("returns a detached JSON value instead of the caller-owned object", () => {
    const input = { nested: { value: "before" } };
    const result = filterJsonInputAtBoundary(input, boundaryPolicy);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    input.nested.value = "after";
    expect(result.value).toEqual({ nested: { value: "before" } });
  });

  it("rejects array properties that JSON serialization would silently drop", () => {
    const values = ["safe"] as Array<string> & { hidden?: string };
    values.hidden = "must not disappear";

    const result = filterJsonInputAtBoundary(values, boundaryPolicy);

    expect(result).toMatchObject({
      ok: false,
      issues: [expect.objectContaining({ code: "invalid_json_value" })],
    });
  });

  it("rejects a huge sparse array from its declared length", () => {
    const result = filterJsonInputAtBoundary(
      new Array(100_000_000),
      boundaryPolicy,
    );

    expect(result).toMatchObject({
      ok: false,
      issues: [expect.objectContaining({ code: "node_limit_exceeded" })],
    });
  });
});

describe("createInputBoundaryAdapter", () => {
  const adapter = createInputBoundaryAdapter((input) =>
    filterJsonInputAtBoundary(input, boundaryPolicy),
  );

  it("returns only the normalized value from accepted input", () => {
    expect(adapter.require('{"safe":true}')).toEqual({ safe: true });
  });

  it("throws structured issues before rejected input reaches a consumer", () => {
    try {
      adapter.require('{"__proto__":{}}');
      throw new Error("Expected the boundary to reject input");
    } catch (error) {
      expect(error).toBeInstanceOf(InputBoundaryRejectedError);
      expect((error as InputBoundaryRejectedError).issues).toContainEqual(
        expect.objectContaining({
          code: "unsafe_property",
          path: "$.__proto__",
        }),
      );
    }
  });
});

describe("filterItemCompositionConfig boundary integration", () => {
  it("accepts an injected item-composition policy", () => {
    const result = filterItemCompositionConfig(composition, {
      ...DEFAULT_ITEM_COMPOSITION_POLICY,
      maxNestingDepth: 1,
    });

    expect(result).toMatchObject({
      ok: false,
      issues: [expect.objectContaining({ code: "nesting_too_deep" })],
    });
  });

  it("rejects an invalid domain limit in an injected policy", () => {
    const result = filterItemCompositionConfig(composition, {
      ...DEFAULT_ITEM_COMPOSITION_POLICY,
      maxFields: 0,
    });

    expect(result).toMatchObject({
      ok: false,
      issues: [expect.objectContaining({ code: "invalid_boundary_policy" })],
    });
  });

  it("preserves nested markdown sanitization evidence", () => {
    const result = filterItemCompositionConfig(composition);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.sanitizationChanges).toContainEqual({
        code: "raw_html_removed",
        count: 2,
      });
      expect(JSON.stringify(result.value)).not.toContain("<script>");
    }
  });
});

describe("filterDetailLayoutConfig policy boundary", () => {
  it("does not allow injected policy to enable an unsafe link protocol", () => {
    const result = filterDetailLayoutConfig(
      {
        schemaVersion: "configurable-detail-layout.v1",
        sections: [
          {
            id: "notes",
            type: "markdown",
            source: { kind: "literal", markdown: "[bad](javascript:alert(1))" },
          },
        ],
      },
      composition.fields,
      {
        ...DEFAULT_DETAIL_LAYOUT_POLICY,
        allowedLinkProtocols: ["https", "javascript"],
      },
    );

    expect(result).toMatchObject({
      ok: false,
      issues: [expect.objectContaining({ code: "invalid_boundary_policy" })],
    });
  });
});

describe("published policy contracts", () => {
  it("keeps common boundary limits in the runtime defaults", () => {
    expect(DEFAULT_DETAIL_LAYOUT_POLICY).toMatchObject(
      detailPolicyContract.limits,
    );
    expect(DEFAULT_ITEM_COMPOSITION_POLICY).toMatchObject(
      compositionPolicyContract.limits,
    );
  });

  it("keeps item string and collection limits aligned with the schema", () => {
    expect(compositionSchema.properties.display.properties.detailFields.maxItems).toBe(
      compositionPolicyContract.limits.maxFields,
    );
    expect(
      compositionSchema.properties.creation.properties.initialTitle.properties.value
        .maxLength,
    ).toBe(compositionPolicyContract.limits.maxInitialTitleCharacters);
    expect(
      compositionSchema.$defs.selectField.properties.options.items.properties.value
        .maxLength,
    ).toBe(compositionPolicyContract.limits.maxOptionValueCharacters);
    expect(
      compositionSchema.$defs.selectField.properties.options.items.properties.label
        .maxLength,
    ).toBe(compositionPolicyContract.limits.maxOptionLabelCharacters);
  });
});
