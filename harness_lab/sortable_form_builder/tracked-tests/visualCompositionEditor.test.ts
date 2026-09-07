import { describe, expect, it } from "vitest";
import {
  appendCompositionField,
  removeCompositionField,
  reorderCompositionFields,
  replaceCompositionField,
  reorderDetailSections,
  type ItemCompositionDefinition,
} from "@torisetsu/configurable-list";

const composition: ItemCompositionDefinition = {
  schemaVersion: "configurable-item-composition.v1",
  fields: [
    { name: "title", type: "text", label: "タイトル" },
    { name: "notes", type: "textarea", label: "メモ" },
    {
      name: "priority",
      type: "select",
      label: "優先度",
      options: [{ value: "high", label: "高" }],
    },
  ],
  creation: { initialTitle: { field: "title", value: "新しい項目" } },
  display: {
    titleField: "title",
    summaryField: "notes",
    badgeField: "priority",
    detailLayout: {
      schemaVersion: "configurable-detail-layout.v1",
      sections: [
        {
          id: "fields",
          type: "field-list",
          fields: ["title", "priority"],
          columns: 2,
        },
        {
          id: "notes",
          type: "markdown",
          source: { kind: "field", field: "notes" },
        },
      ],
    },
  },
};

describe("visual composition editor operations", () => {
  it("adds a new field to both the form and inline details", () => {
    const next = appendCompositionField(composition, {
      name: "owner",
      type: "text",
      label: "担当者",
    });

    expect(next.fields.map((field) => field.name)).toContain("owner");
    expect(next.display.detailLayout?.sections[0]).toMatchObject({
      type: "field-list",
      fields: ["title", "priority", "owner"],
    });
  });

  it("creates a field-list when details have no field-list section", () => {
    const withoutFieldList: ItemCompositionDefinition = {
      ...composition,
      display: {
        ...composition.display,
        detailLayout: {
          schemaVersion: "configurable-detail-layout.v1",
          sections: [
            {
              id: "guidance",
              type: "markdown",
              source: { kind: "literal", markdown: "確認してください" },
            },
          ],
        },
      },
    };
    const next = appendCompositionField(withoutFieldList, {
      name: "owner",
      type: "text",
      label: "担当者",
    });

    expect(next.display.detailLayout?.sections.at(-1)).toMatchObject({
      type: "field-list",
      fields: ["owner"],
    });
  });

  it("reorders fields without changing field identities", () => {
    const next = reorderCompositionFields(composition, "priority", "title");

    expect(next.fields.map((field) => field.name)).toEqual([
      "priority",
      "title",
      "notes",
    ]);
    expect(next.display.titleField).toBe("title");
  });

  it("updates all references when a field name changes", () => {
    const next = replaceCompositionField(composition, "notes", {
      name: "description",
      type: "textarea",
      label: "説明",
    });

    expect(next.display.summaryField).toBe("description");
    expect(next.display.detailLayout?.sections[1]).toMatchObject({
      source: { kind: "field", field: "description" },
    });
  });

  it("removes dangling references with the deleted field", () => {
    const next = removeCompositionField(composition, "notes");

    expect(next.fields.map((field) => field.name)).toEqual(["title", "priority"]);
    expect(next.display.summaryField).toBeUndefined();
    expect(next.display.detailLayout?.sections.map((section) => section.id)).toEqual([
      "fields",
    ]);
  });

  it("reorders detail sections independently from fields", () => {
    const next = reorderDetailSections(composition, "notes", "fields");

    expect(next.display.detailLayout?.sections.map((section) => section.id)).toEqual([
      "notes",
      "fields",
    ]);
    expect(next.fields.map((field) => field.name)).toEqual([
      "title",
      "notes",
      "priority",
    ]);
  });
});
