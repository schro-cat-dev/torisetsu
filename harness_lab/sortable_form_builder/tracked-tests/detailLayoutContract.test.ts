import { describe, expect, it } from "vitest";
import detailLayoutSchema from "../packages/configurable-list-core/contracts/detail-layout.schema.json";
import detailLayoutPolicy from "../packages/configurable-list-core/contracts/detail-layout.policy.json";

describe("shared detail-layout contracts", () => {
  it("pins schema and policy versions", () => {
    expect(detailLayoutSchema.$schema).toBe(
      "https://json-schema.org/draft/2020-12/schema",
    );
    expect(detailLayoutSchema.properties.schemaVersion.const).toBe(
      "configurable-detail-layout.v1",
    );
    expect(detailLayoutPolicy.schemaVersion).toBe(
      "configurable-detail-layout-policy.v1",
    );
  });

  it("keeps schema collection limits aligned with the runtime policy", () => {
    expect(detailLayoutSchema.properties.sections.maxItems).toBe(
      detailLayoutPolicy.limits.maxSections,
    );
    expect(detailLayoutSchema.$defs.sectionTitle.maxLength).toBe(
      detailLayoutPolicy.limits.maxSectionTitleCharacters,
    );
    expect(detailLayoutSchema.$defs.markdownText.maxLength).toBe(
      detailLayoutPolicy.limits.maxMarkdownCharacters,
    );
    expect(detailLayoutSchema.$defs.fieldList.properties.fields.maxItems).toBe(
      detailLayoutPolicy.limits.maxFieldsPerSection,
    );
  });
});
