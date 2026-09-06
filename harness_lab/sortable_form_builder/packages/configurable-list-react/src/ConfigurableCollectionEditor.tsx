import { Plus, Settings2 } from "lucide-react";
import { useMemo, useReducer } from "react";
import {
  applyItemComposition,
  completeDetailLayoutWithUnreferencedFields,
  createDraftItem,
  filterDetailLayoutConfig,
  initialCollectionEditorViewState,
  migrateItemsToComposition,
  reduceCollectionEditorViewState,
  serializeItemComposition,
  type CollectionDefinition,
  type ConfigurableItem,
  type ItemFieldValues,
  type ItemCompositionDefinition,
} from "@torisetsu/configurable-list-core";
import { ConfigurableItemForm } from "./ConfigurableItemForm";
import { ItemCompositionEditorForm } from "./item-composition";
import { SortableItemList } from "./SortableItemList";
import { ModalDialog } from "./ui";

export interface ConfigurableCollectionEditorProps {
  definition: CollectionDefinition;
  items: ReadonlyArray<ConfigurableItem>;
  onItemsChange: (items: Array<ConfigurableItem>) => void;
  onDefinitionChange?: (definition: CollectionDefinition) => void;
  createItemId?: () => string;
}

export function ConfigurableCollectionEditor({
  definition,
  items,
  onItemsChange,
  onDefinitionChange,
  createItemId = () => crypto.randomUUID(),
}: ConfigurableCollectionEditorProps) {
  const [viewState, dispatchView] = useReducer(
    reduceCollectionEditorViewState,
    initialCollectionEditorViewState,
  );
  const editingItem = items.find((item) => item.id === viewState.editingItemId);
  const filteredDetailLayout = useMemo(() => {
    const detailFieldNames =
      definition.display.detailFields ?? definition.fields.map((field) => field.name);
    const fallbackLayout = {
      schemaVersion: "configurable-detail-layout.v1",
      sections: [
        {
          id: "default-fields",
          type: "field-list",
          fields: detailFieldNames,
        },
      ],
    };
    const filtered = filterDetailLayoutConfig(
      definition.display.detailLayout ?? fallbackLayout,
      definition.fields,
    );
    return filtered.ok
      ? {
          ...filtered,
          value: completeDetailLayoutWithUnreferencedFields(
            filtered.value,
            definition.fields,
          ),
        }
      : filtered;
  }, [definition]);

  const addDraftItem = () => {
    const newItem = createDraftItem(definition, createItemId());
    onItemsChange([...items, newItem]);
  };

  const saveItem = (values: ItemFieldValues) => {
    if (!viewState.editingItemId) {
      return;
    }

    onItemsChange(
      items.map((item) =>
        item.id === viewState.editingItemId ? { ...item, values } : item,
      ),
    );
    dispatchView({ type: "edit-saved", itemId: viewState.editingItemId });
  };

  const deleteItem = (itemId: string) => {
    onItemsChange(items.filter((item) => item.id !== itemId));
    dispatchView({ type: "item-deleted", itemId });
  };

  const applyComposition = (composition: ItemCompositionDefinition) => {
    if (!onDefinitionChange) {
      return;
    }

    const nextDefinition = applyItemComposition(definition, composition);
    const nextItems = migrateItemsToComposition(
      items,
      definition.fields,
      composition.fields,
    );
    onDefinitionChange(nextDefinition);
    onItemsChange(nextItems);
    dispatchView({ type: "close-composition-editor" });
  };

  return (
    <div className="collection-editor">
      <section className="list-panel" aria-labelledby="collection-heading">
        <div className="panel-heading">
          <div>
            <h2 id="collection-heading">{definition.label}</h2>
            <span className="item-count">{items.length}件</span>
          </div>
          <div className="panel-actions">
            {onDefinitionChange ? (
              <button
                className="button secondary"
                type="button"
                onClick={() => dispatchView({ type: "open-composition-editor" })}
              >
                <Settings2 aria-hidden="true" size={18} />
                構成を編集
              </button>
            ) : null}
            <button
              className="button primary"
              type="button"
              onClick={addDraftItem}
            >
              <Plus aria-hidden="true" size={18} />
              {definition.itemLabel}を追加
            </button>
          </div>
        </div>

        <SortableItemList
          definition={definition}
          items={items}
          onItemsChange={onItemsChange}
          detailItemId={viewState.detailItemId}
          detailLayout={
            filteredDetailLayout.ok ? filteredDetailLayout.value : undefined
          }
          detailLayoutError={!filteredDetailLayout.ok}
          onToggleDetails={(itemId) =>
            dispatchView({ type: "toggle-detail", itemId })
          }
          onEdit={(itemId) => {
            dispatchView({ type: "open-edit", itemId });
          }}
          onDelete={deleteItem}
        />
      </section>

      {editingItem ? (
        <ModalDialog
          title={`${definition.itemLabel}を編集`}
          onClose={() => dispatchView({ type: "close-edit" })}
        >
          <ConfigurableItemForm
            key={editingItem.id}
            fields={definition.fields}
            initialValues={editingItem.values}
            submitLabel="変更を保存"
            onSubmit={saveItem}
            onCancel={() => dispatchView({ type: "close-edit" })}
          />
        </ModalDialog>
      ) : null}

      {viewState.compositionEditorOpen && onDefinitionChange ? (
        <ModalDialog
          title={`${definition.itemLabel}の構成を編集`}
          size="wide"
          onClose={() => dispatchView({ type: "close-composition-editor" })}
        >
          <ItemCompositionEditorForm
            key={definition.id}
            initialDocument={serializeItemComposition(definition)}
            onSubmit={applyComposition}
            onCancel={() => dispatchView({ type: "close-composition-editor" })}
          />
        </ModalDialog>
      ) : null}
    </div>
  );
}
