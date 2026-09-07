import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  ItemCompositionEditorForm,
  type ItemCompositionDefinition,
} from "@torisetsu/configurable-list";

const composition: ItemCompositionDefinition = {
  schemaVersion: "configurable-item-composition.v1",
  fields: [
    { name: "title", type: "text", label: "作業名" },
    { name: "notes", type: "textarea", label: "メモ" },
  ],
  creation: { initialTitle: { field: "title", value: "新しい作業" } },
  display: { titleField: "title", summaryField: "notes" },
};

describe("ItemCompositionEditorForm", () => {
  it("shows the visual editor first while keeping JSON as another mode", () => {
    const html = renderToStaticMarkup(
      <ItemCompositionEditorForm
        initialDocument={JSON.stringify(composition)}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(html).toContain("画面編集");
    expect(html).toContain("JSON編集");
    expect(html).toContain("入力項目");
    expect(html).toContain("詳細の表示順");
    expect(html).toContain("作業名");
  });
});
