import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  InlineItemDetails,
  type CollectionDefinition,
  type ConfigurableItem,
} from "@torisetsu/configurable-list";

const definition: CollectionDefinition = {
  schemaVersion: "configurable-collection.v1",
  id: "tasks",
  label: "作業",
  itemLabel: "作業",
  fields: [{ name: "title", type: "text", label: "作業名" }],
  creation: { initialTitle: { field: "title", value: "新しい作業" } },
  display: { titleField: "title" },
};
const item: ConfigurableItem = {
  id: "task-1",
  values: { title: "確認作業" },
};

describe("InlineItemDetails", () => {
  it("renders details in an inline region without dialog markup", () => {
    const html = renderToStaticMarkup(
      <InlineItemDetails definition={definition} item={item} />,
    );

    expect(html).toContain('class="inline-item-details"');
    expect(html).toContain("確認作業");
    expect(html).not.toContain('role="dialog"');
  });

  it("rejects an invalid layout passed through the public component", () => {
    const invalidLayout = {
      schemaVersion: "configurable-detail-layout.v1",
      sections: [{ id: "unsafe", type: "unsupported" }],
    };

    const html = renderToStaticMarkup(
      <InlineItemDetails
        definition={definition}
        item={item}
        layout={invalidLayout}
      />,
    );

    expect(html).toContain('data-layout-status="invalid"');
    expect(html).toContain("詳細の表示設定を読み込めませんでした。");
  });

  it("does not treat an explicit null layout as an omitted layout", () => {
    const html = renderToStaticMarkup(
      <InlineItemDetails definition={definition} item={item} layout={null} />,
    );

    expect(html).toContain('data-layout-status="invalid"');
  });
});
