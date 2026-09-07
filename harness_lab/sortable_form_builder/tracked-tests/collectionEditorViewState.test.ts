import { describe, expect, it } from "vitest";
import {
  initialCollectionEditorViewState,
  reduceCollectionEditorViewState,
} from "@torisetsu/configurable-list";

describe("collection editor detail/edit state", () => {
  it("toggles inline details for the selected item", () => {
    const opened = reduceCollectionEditorViewState(
      initialCollectionEditorViewState,
      { type: "toggle-detail", itemId: "item-1" },
    );
    expect(opened.detailItemId).toBe("item-1");

    const closed = reduceCollectionEditorViewState(opened, {
      type: "toggle-detail",
      itemId: "item-1",
    });
    expect(closed.detailItemId).toBeNull();

    const moved = reduceCollectionEditorViewState(opened, {
      type: "toggle-detail",
      itemId: "item-2",
    });
    expect(moved.detailItemId).toBe("item-2");
  });

  it("opens detail and edit as mutually exclusive states", () => {
    const detailOpen = reduceCollectionEditorViewState(
      initialCollectionEditorViewState,
      { type: "open-detail", itemId: "item-1" },
    );
    expect(detailOpen).toEqual({
      detailItemId: "item-1",
      editingItemId: null,
      compositionEditorOpen: false,
    });

    const editOpen = reduceCollectionEditorViewState(detailOpen, {
      type: "open-edit",
      itemId: "item-1",
    });
    expect(editOpen).toEqual({
      detailItemId: null,
      editingItemId: "item-1",
      compositionEditorOpen: false,
    });

    const detailClosed = reduceCollectionEditorViewState(detailOpen, {
      type: "close-detail",
    });
    expect(detailClosed).toEqual(initialCollectionEditorViewState);

    expect(
      reduceCollectionEditorViewState(editOpen, {
        type: "edit-saved",
        itemId: "item-1",
      }),
    ).toEqual({
      detailItemId: "item-1",
      editingItemId: null,
      compositionEditorOpen: false,
    });
  });

  it("opens composition editing without leaving another modal open", () => {
    const detailOpen = reduceCollectionEditorViewState(
      initialCollectionEditorViewState,
      { type: "open-detail", itemId: "item-1" },
    );

    expect(
      reduceCollectionEditorViewState(detailOpen, {
        type: "open-composition-editor",
      }),
    ).toEqual({
      detailItemId: null,
      editingItemId: null,
      compositionEditorOpen: true,
    });
  });

  it("closes a deleted item from either modal", () => {
    const detailOpen = {
      detailItemId: "item-1",
      editingItemId: null,
      compositionEditorOpen: false,
    };
    expect(
      reduceCollectionEditorViewState(detailOpen, {
        type: "item-deleted",
        itemId: "item-1",
      }),
    ).toEqual(initialCollectionEditorViewState);
  });
});
