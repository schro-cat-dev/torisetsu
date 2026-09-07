import { describe, expect, it } from "vitest";
import compositionPolicy from "../packages/configurable-list-core/contracts/item-composition.policy.json";
import compositionSchema from "../packages/configurable-list-core/contracts/item-composition.schema.json";

describe("item composition contracts", () => {
  it("pins the schema and policy versions", () => {
    expect(compositionSchema.properties.schemaVersion.const).toBe(
      "configurable-item-composition.v1",
    );
    expect(compositionPolicy.schemaVersion).toBe(
      "configurable-item-composition-policy.v1",
    );
  });

  it("keeps schema limits aligned with the runtime policy", () => {
    expect(compositionSchema.properties.fields.maxItems).toBe(
      compositionPolicy.limits.maxFields,
    );
    expect(compositionSchema.$defs.fieldName.pattern).toContain(
      String(compositionPolicy.limits.maxFieldNameCharacters - 1),
    );
    expect(compositionSchema.$defs.textField.properties.label.maxLength).toBe(
      compositionPolicy.limits.maxLabelCharacters,
    );
    expect(
      compositionSchema.$defs.selectField.properties.options.maxItems,
    ).toBe(compositionPolicy.limits.maxOptions);
  });
});
