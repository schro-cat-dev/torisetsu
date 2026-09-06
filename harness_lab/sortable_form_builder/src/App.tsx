import { ClipboardList, MessagesSquare } from "lucide-react";
import { useEffect, useState } from "react";
import {
  applyItemComposition,
  ConfigurableCollectionEditor,
  createItemCompositionSnapshot,
  filterItemCompositionConfig,
  type CollectionDefinition,
  type ConfigurableItem,
} from "@torisetsu/configurable-list";
import {
  collectionDefinitions,
  initialItems,
  type CollectionId,
} from "./demo/collectionDefinitions";

const storageKey = "sortable-form-builder.demo.v1";
const compositionStorageKey = "sortable-form-builder.compositions.v1";

function loadStoredDefinitions(): Record<CollectionId, CollectionDefinition> {
  const fallbackDefinitions: Record<CollectionId, CollectionDefinition> = {
    tasks: collectionDefinitions.tasks,
    contacts: collectionDefinitions.contacts,
  };

  try {
    const storedCompositions = localStorage.getItem(compositionStorageKey);
    if (!storedCompositions) {
      return fallbackDefinitions;
    }

    const parsedCompositions = JSON.parse(storedCompositions) as Record<
      string,
      unknown
    >;
    return (Object.keys(fallbackDefinitions) as CollectionId[]).reduce(
      (definitions, collectionId) => {
        const result = filterItemCompositionConfig(
          parsedCompositions[collectionId],
        );
        definitions[collectionId] = result.ok
          ? applyItemComposition(fallbackDefinitions[collectionId], result.value)
          : fallbackDefinitions[collectionId];
        return definitions;
      },
      { ...fallbackDefinitions },
    );
  } catch {
    return fallbackDefinitions;
  }
}

function loadStoredItems() {
  try {
    const storedItems = localStorage.getItem(storageKey);
    if (!storedItems) {
      return initialItems;
    }

    const parsedItems = JSON.parse(storedItems) as Partial<typeof initialItems>;
    return {
      tasks: Array.isArray(parsedItems.tasks) ? parsedItems.tasks : initialItems.tasks,
      contacts: Array.isArray(parsedItems.contacts)
        ? parsedItems.contacts
        : initialItems.contacts,
    };
  } catch {
    return initialItems;
  }
}

export function App() {
  const [activeCollectionId, setActiveCollectionId] =
    useState<CollectionId>("tasks");
  const [definitionsByCollection, setDefinitionsByCollection] =
    useState(loadStoredDefinitions);
  const [itemsByCollection, setItemsByCollection] = useState(loadStoredItems);
  const activeDefinition = definitionsByCollection[activeCollectionId];

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(itemsByCollection));
  }, [itemsByCollection]);

  useEffect(() => {
    localStorage.setItem(
      compositionStorageKey,
      JSON.stringify({
        tasks: createItemCompositionSnapshot(definitionsByCollection.tasks),
        contacts: createItemCompositionSnapshot(definitionsByCollection.contacts),
      }),
    );
  }, [definitionsByCollection]);

  const updateActiveItems = (items: Array<ConfigurableItem>) => {
    setItemsByCollection((currentItems) => ({
      ...currentItems,
      [activeCollectionId]: items,
    }));
  };

  const updateActiveDefinition = (definition: CollectionDefinition) => {
    setDefinitionsByCollection((currentDefinitions) => ({
      ...currentDefinitions,
      [activeCollectionId]: definition,
    }));
  };

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">CONFIGURABLE LIST</p>
          <h1>並び替えフォーム</h1>
        </div>

        <div className="collection-switcher" aria-label="フォーム種別">
          <button
            className={activeCollectionId === "tasks" ? "active" : ""}
            type="button"
            aria-pressed={activeCollectionId === "tasks"}
            onClick={() => setActiveCollectionId("tasks")}
          >
            <ClipboardList aria-hidden="true" size={17} />
            作業項目
          </button>
          <button
            className={activeCollectionId === "contacts" ? "active" : ""}
            type="button"
            aria-pressed={activeCollectionId === "contacts"}
            onClick={() => setActiveCollectionId("contacts")}
          >
            <MessagesSquare aria-hidden="true" size={17} />
            連絡メモ
          </button>
        </div>
      </header>

      <ConfigurableCollectionEditor
        key={activeCollectionId}
        definition={activeDefinition}
        items={itemsByCollection[activeCollectionId]}
        onItemsChange={updateActiveItems}
        onDefinitionChange={updateActiveDefinition}
      />
    </main>
  );
}
