import { describe, expect, it } from "vitest";
import {
  applyItemComposition,
  filterItemCompositionConfig,
  migrateItemsToComposition,
  type CollectionDefinition,
  type ConfigurableItem,
} from "@torisetsu/configurable-list";

const currentDefinition: CollectionDefinition = {
  schemaVersion: "configurable-collection.v1",
  id: "sample",
  label: "サンプル一覧",
  itemLabel: "項目",
  creation: {
    initialTitle: { field: "title", value: "新しい項目" },
  },
  display: {
    titleField: "title",
    summaryField: "notes",
  },
  fields: [
    { name: "title", type: "text", label: "タイトル" },
    { name: "notes", type: "textarea", label: "メモ" },
    {
      name: "status",
      type: "select",
      label: "状態",
      options: [
        { value: "open", label: "未着手" },
        { value: "done", label: "完了" },
      ],
    },
    { name: "estimate", type: "number", label: "見積もり", min: 0, max: 60 },
  ],
};

const nextComposition = {
  schemaVersion: "configurable-item-composition.v1",
  creation: {
    initialTitle: { field: "title", value: "新しい項目" },
  },
  display: {
    titleField: "title",
    summaryField: "description",
    detailLayout: {
      schemaVersion: "configurable-detail-layout.v1",
      sections: [
        {
          id: "details",
          type: "field-list",
          fields: ["title", "description", "ready"],
        },
      ],
    },
  },
  fields: [
    { name: "title", type: "textarea", label: "タイトル" },
    { name: "description", type: "textarea", label: "説明" },
    {
      name: "status",
      type: "select",
      label: "状態",
      options: [{ value: "done", label: "完了" }],
    },
    { name: "estimate", type: "number", label: "見積もり", min: 20, max: 60 },
    { name: "ready", type: "checkbox", label: "準備済み" },
  ],
};

describe("item composition", () => {
  it("accepts a valid JSON-based composition", () => {
    const result = filterItemCompositionConfig(
      `\`\`\`json\n${JSON.stringify(nextComposition)}\n\`\`\``,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.fields.map((field) => field.name)).toEqual([
        "title",
        "description",
        "status",
        "estimate",
        "ready",
      ]);
    }
  });

  it("rejects duplicate field names and invalid detail field references", () => {
    const result = filterItemCompositionConfig({
      ...nextComposition,
      fields: [
        ...nextComposition.fields,
        { name: "title", type: "text", label: "重複" },
      ],
      display: {
        ...nextComposition.display,
        detailLayout: {
          schemaVersion: "configurable-detail-layout.v1",
          sections: [
            { id: "missing", type: "field-list", fields: ["missing"] },
          ],
        },
      },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ code: "duplicate_field_name" }),
          expect.objectContaining({ code: "invalid_detail_layout" }),
        ]),
      );
    }
  });

  it("keeps only compatible values and leaves unmatched fields blank", () => {
    const items: ConfigurableItem[] = [
      {
        id: "item-1",
        values: {
          title: "既存タイトル",
          notes: "削除される値",
          status: "open",
          estimate: 10,
        },
      },
    ];
    const filtered = filterItemCompositionConfig(nextComposition);
    expect(filtered.ok).toBe(true);
    if (!filtered.ok) return;

    const migrated = migrateItemsToComposition(
      items,
      currentDefinition.fields,
      filtered.value.fields,
    );

    expect(migrated).toEqual([
      {
        id: "item-1",
        values: {
          title: "既存タイトル",
          description: "",
          status: "",
          estimate: "",
          ready: false,
        },
      },
    ]);
  });

  it("preserves collection identity while replacing only item composition", () => {
    const filtered = filterItemCompositionConfig(nextComposition);
    expect(filtered.ok).toBe(true);
    if (!filtered.ok) return;

    const nextDefinition = applyItemComposition(currentDefinition, filtered.value);

    expect(nextDefinition).toMatchObject({
      id: "sample",
      label: "サンプル一覧",
      itemLabel: "項目",
      creation: nextComposition.creation,
      display: nextComposition.display,
    });
  });
});
