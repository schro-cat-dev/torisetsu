import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type {
  CollectionDefinition,
  ConfigurableItem,
  DetailLayoutDefinition,
  FieldValue,
} from "@torisetsu/configurable-list-core";
import {
  Eye,
  GripVertical,
  Pencil,
  Trash2,
} from "lucide-react";
import { InlineItemDetails } from "./InlineItemDetails";

export interface SortableItemListProps<FieldName extends string> {
  definition: CollectionDefinition<FieldName>;
  items: ReadonlyArray<ConfigurableItem<FieldName>>;
  onItemsChange: (items: Array<ConfigurableItem<FieldName>>) => void;
  onEdit: (itemId: string) => void;
  onDelete: (itemId: string) => void;
  detailItemId: string | null;
  detailLayout?: DetailLayoutDefinition<FieldName>;
  detailLayoutError?: boolean;
  onToggleDetails: (itemId: string) => void;
}

export function SortableItemList<FieldName extends string>({
  definition,
  items,
  onItemsChange,
  onEdit,
  onDelete,
  detailItemId,
  detailLayout,
  detailLayoutError,
  onToggleDetails,
}: SortableItemListProps<FieldName>) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) {
      return;
    }

    const previousIndex = items.findIndex((item) => item.id === active.id);
    const nextIndex = items.findIndex((item) => item.id === over.id);

    if (previousIndex >= 0 && nextIndex >= 0) {
      onItemsChange(arrayMove([...items], previousIndex, nextIndex));
    }
  };

  if (items.length === 0) {
    return <p className="empty-list">まだ項目がありません。</p>;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((item) => item.id)}
        strategy={verticalListSortingStrategy}
      >
        <ol className="sortable-list" aria-label={`${definition.label}の並び順`}>
          {items.map((item, index) => (
            <SortableItemRow
              key={item.id}
              definition={definition}
              item={item}
              position={index + 1}
              detailsOpen={detailItemId === item.id}
              detailLayout={detailLayout}
              detailLayoutError={detailLayoutError}
              onToggleDetails={() => onToggleDetails(item.id)}
              onEdit={() => onEdit(item.id)}
              onDelete={() => onDelete(item.id)}
            />
          ))}
        </ol>
      </SortableContext>
    </DndContext>
  );
}

interface SortableItemRowProps<FieldName extends string> {
  definition: CollectionDefinition<FieldName>;
  item: ConfigurableItem<FieldName>;
  position: number;
  detailsOpen: boolean;
  detailLayout?: DetailLayoutDefinition<FieldName>;
  detailLayoutError?: boolean;
  onToggleDetails: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function displayText(value: FieldValue | undefined) {
  if (typeof value === "boolean") {
    return value ? "有効" : "無効";
  }
  return String(value ?? "");
}

function SortableItemRow<FieldName extends string>({
  definition,
  item,
  position,
  detailsOpen,
  detailLayout,
  detailLayoutError,
  onToggleDetails,
  onEdit,
  onDelete,
}: SortableItemRowProps<FieldName>) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const title = displayText(item.values[definition.display.titleField]);
  const summary = definition.display.summaryField
    ? displayText(item.values[definition.display.summaryField])
    : "";
  const badge = definition.display.badgeField
    ? displayText(item.values[definition.display.badgeField])
    : "";

  return (
    <li
      ref={setNodeRef}
      className={`sortable-item ${isDragging ? "dragging" : ""}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <button
        className="icon-button drag-handle"
        type="button"
        aria-label={`${title}を並び替える。現在${position}番目`}
        title="ドラッグまたはキーボードで並び替え"
        {...attributes}
        {...listeners}
      >
        <GripVertical aria-hidden="true" size={19} />
      </button>

      <button
        className="item-content"
        type="button"
        aria-expanded={detailsOpen}
        aria-label={`${title || definition.itemLabel}の詳細を${detailsOpen ? "閉じる" : "開く"}`}
        onClick={onToggleDetails}
      >
        <span className="item-title-row">
          <span className="item-serial">No. {position}</span>
          <strong>{title || `名称未設定の${definition.itemLabel}`}</strong>
          {badge ? <span className="item-badge">{badge}</span> : null}
        </span>
        {summary ? <span className="item-summary">{summary}</span> : null}
        <span className="detail-toggle-icon" aria-hidden="true">
          <Eye size={17} />
        </span>
      </button>

      <div className="item-actions">
        <button
          className="icon-button"
          type="button"
          aria-label={`${title}を編集`}
          title="編集"
          onClick={onEdit}
        >
          <Pencil aria-hidden="true" size={17} />
        </button>
        <button
          className="icon-button danger"
          type="button"
          aria-label={`${title}を削除`}
          title="削除"
          onClick={onDelete}
        >
          <Trash2 aria-hidden="true" size={17} />
        </button>
      </div>

      {detailsOpen ? (
        <InlineItemDetails
          definition={definition}
          item={item}
          layout={detailLayout}
          layoutError={detailLayoutError}
        />
      ) : null}
    </li>
  );
}
