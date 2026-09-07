import { describe, expect, it } from "vitest";
import {
  createDefaultFieldValues,
  createDraftItem,
  validateFieldValues,
  type FieldDefinition,
} from "@torisetsu/configurable-list";

const fields = [
  {
    name: "title",
    type: "text",
    label: "件名",
    required: true,
    maxLength: 10,
  },
  {
    name: "minutes",
    type: "number",
    label: "時間",
    defaultValue: 15,
    min: 5,
    max: 60,
  },
  {
    name: "enabled",
    type: "checkbox",
    label: "有効",
    required: true,
  },
  {
    name: "status",
    type: "select",
    label: "状態",
    options: [{ value: "open", label: "未完了" }],
  },
] satisfies ReadonlyArray<FieldDefinition>;

describe("configurable field values", () => {
  it("creates defaults without item-specific logic", () => {
    expect(createDefaultFieldValues(fields)).toEqual({
      title: "",
      minutes: 15,
      enabled: false,
      status: "open",
    });
  });

  it("returns errors for required, length, and numeric bounds", () => {
    expect(
      validateFieldValues(fields, {
        title: "",
        minutes: 3,
        enabled: false,
        status: "unknown",
      }),
    ).toEqual({
      title: "件名を入力してください。",
      minutes: "時間は5以上にしてください。",
      enabled: "有効を入力してください。",
      status: "状態の選択肢が正しくありません。",
    });

    expect(
      validateFieldValues(fields, {
        title: "12345678901",
        minutes: 61,
        enabled: true,
        status: "open",
      }),
    ).toEqual({
      title: "件名は10文字以内で入力してください。",
      minutes: "時間は60以下にしてください。",
    });
  });

  it("creates an unedited item from collection settings", () => {
    const definition = {
      schemaVersion: "configurable-collection.v1",
      id: "notes",
      label: "メモ",
      itemLabel: "メモ",
      creation: {
        initialTitle: { field: "title", value: "新しいメモ" },
      },
      display: { titleField: "title" },
      fields: [
        { name: "title", type: "text", label: "件名", required: true },
      ],
    } as const;

    expect(
      createDraftItem(definition, "d"),
    ).toEqual({
      id: "d",
      values: { title: "新しいメモ" },
    });
  });

  it("rejects a sequential title field that cannot hold text", () => {
    const invalidDefinition = {
      schemaVersion: "configurable-collection.v1",
      id: "scores",
      label: "点数",
      itemLabel: "点数",
      creation: {
        initialTitle: { field: "score", value: "新しい点数" },
      },
      display: { titleField: "score" },
      fields: [{ name: "score", type: "number", label: "点数" }],
    } as const;

    expect(() =>
      createDraftItem(invalidDefinition, "score-1"),
    ).toThrow('Initial title field "score" must be a text or textarea field.');
  });
});
