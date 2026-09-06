export interface CollectionEditorViewState {
  detailItemId: string | null;
  editingItemId: string | null;
  compositionEditorOpen: boolean;
}

export type CollectionEditorViewAction =
  | { type: "toggle-detail"; itemId: string }
  | { type: "open-detail"; itemId: string }
  | { type: "close-detail" }
  | { type: "open-edit"; itemId: string }
  | { type: "close-edit" }
  | { type: "open-composition-editor" }
  | { type: "close-composition-editor" }
  | { type: "edit-saved"; itemId: string }
  | { type: "item-deleted"; itemId: string };

export const initialCollectionEditorViewState: CollectionEditorViewState = {
  detailItemId: null,
  editingItemId: null,
  compositionEditorOpen: false,
};

export function reduceCollectionEditorViewState(
  state: CollectionEditorViewState,
  action: CollectionEditorViewAction,
): CollectionEditorViewState {
  switch (action.type) {
    case "toggle-detail":
      return {
        detailItemId:
          state.detailItemId === action.itemId ? null : action.itemId,
        editingItemId: null,
        compositionEditorOpen: false,
      };
    case "open-detail":
      return {
        detailItemId: action.itemId,
        editingItemId: null,
        compositionEditorOpen: false,
      };
    case "close-detail":
      return { ...state, detailItemId: null };
    case "open-edit":
      return {
        detailItemId: null,
        editingItemId: action.itemId,
        compositionEditorOpen: false,
      };
    case "close-edit":
      return { ...state, editingItemId: null };
    case "edit-saved":
      return {
        detailItemId: action.itemId,
        editingItemId: null,
        compositionEditorOpen: false,
      };
    case "open-composition-editor":
      return {
        detailItemId: null,
        editingItemId: null,
        compositionEditorOpen: true,
      };
    case "close-composition-editor":
      return { ...state, compositionEditorOpen: false };
    case "item-deleted":
      return {
        detailItemId:
          state.detailItemId === action.itemId ? null : state.detailItemId,
        editingItemId:
          state.editingItemId === action.itemId ? null : state.editingItemId,
        compositionEditorOpen: state.compositionEditorOpen,
      };
  }
}
