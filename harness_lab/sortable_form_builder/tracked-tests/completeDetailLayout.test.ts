import { describe, expect, it } from "vitest";
import {
  completeDetailLayoutWithUnreferencedFields,
  type DetailLayoutDefinition,
  type FieldDefinition,
} from "@torisetsu/configurable-list";

const fields = [
  { name: "title", type: "text", label: "作業名" },
  { name: "notes", type: "textarea", label: "メモ" },
  { name: "owner", type: "text", label: "担当者" },
] satisfies ReadonlyArray<FieldDefinition>;

describe("completeDetailLayoutWithUnreferencedFields", () => {
  it("adds fields missing from an existing saved layout", () => {
    const layout: DetailLayoutDefinition = {
      schemaVersion: "configurable-detail-layout.v1",
      sections: [
        { id: "main", type: "field-list", fields: ["title"] },
        {
          id: "notes",
          type: "markdown",
          source: { kind: "field", field: "notes" },
        },
      ],
    };

    const completed = completeDetailLayoutWithUnreferencedFields(layout, fields);

    expect(completed.sections[0]).toMatchObject({
      type: "field-list",
      fields: ["title", "owner"],
    });
  });

  it("does not duplicate fields already represented by markdown", () => {
    const layout: DetailLayoutDefinition = {
      schemaVersion: "configurable-detail-layout.v1",
      sections: [
        {
          id: "notes",
          type: "markdown",
          source: { kind: "field", field: "notes" },
        },
      ],
    };

    const completed = completeDetailLayoutWithUnreferencedFields(layout, [fields[1]]);

    expect(completed).toEqual(layout);
  });
});
