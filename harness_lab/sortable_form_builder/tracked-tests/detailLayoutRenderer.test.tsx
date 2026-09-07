import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  DetailLayoutRenderer,
  filterDetailLayoutConfig,
  type ConfigurableItem,
  type FieldDefinition,
} from "@torisetsu/configurable-list";

const fields = [
  { name: "notes", type: "textarea", label: "メモ" },
] satisfies ReadonlyArray<FieldDefinition>;

const item: ConfigurableItem = {
  id: "item-1",
  values: {
    notes:
      "**安全な強調**\n\n<script>alert('x')</script>\n\n[危険なリンク](javascript:alert('x'))",
  },
};

describe("DetailLayoutRenderer", () => {
  it("shows configured fields even when their values are blank", () => {
    const html = renderToStaticMarkup(
      <DetailLayoutRenderer
        layout={{
          schemaVersion: "configurable-detail-layout.v1",
          sections: [
            {
              id: "fields",
              type: "field-list",
              fields: ["notes"],
            },
          ],
        }}
        fields={fields}
        item={{ id: "item-blank", values: { notes: "" } }}
      />,
    );

    expect(html).toContain("メモ");
    expect(html).toContain("未入力");
  });

  it("renders allowed markdown without raw HTML or unsafe URLs", () => {
    const html = renderToStaticMarkup(
      <DetailLayoutRenderer
        layout={{
          schemaVersion: "configurable-detail-layout.v1",
          sections: [
            {
              id: "notes",
              type: "markdown",
              source: { kind: "field", field: "notes" },
            },
          ],
        }}
        fields={fields}
        item={item}
      />,
    );

    expect(html).toContain("<strong>安全な強調</strong>");
    expect(html).not.toContain("<script");
    expect(html).not.toContain("javascript:");
    expect(html).toContain('data-layout-status="valid"');
  });

  it("fails closed when the layout is invalid", () => {
    const html = renderToStaticMarkup(
      <DetailLayoutRenderer
        layout={{ schemaVersion: "unknown", sections: [] }}
        fields={fields}
        item={item}
      />,
    );

    expect(html).toContain('data-layout-status="invalid"');
    expect(html).not.toContain("安全な強調");
  });

  it("accepts a previously normalized layout through the guarded renderer", () => {
    const filtered = filterDetailLayoutConfig(
      {
        schemaVersion: "configurable-detail-layout.v1",
        sections: [
          {
            id: "notes",
            type: "markdown",
            source: { kind: "field", field: "notes" },
          },
        ],
      },
      fields,
    );
    expect(filtered.ok).toBe(true);
    if (!filtered.ok) {
      return;
    }

    const html = renderToStaticMarkup(
      <DetailLayoutRenderer
        layout={filtered.value}
        fields={fields}
        item={item}
      />,
    );

    expect(html).toContain('data-layout-status="valid"');
    expect(html).not.toContain("javascript:");
  });
});
