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
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  DEFAULT_DETAIL_LAYOUT_POLICY,
  reorderDetailSections,
  type DetailLayoutDefinition,
  type DetailSectionDefinition,
  type FieldDefinition,
  type ItemCompositionDefinition,
} from "@torisetsu/configurable-list-core";
import { ChevronDown, ChevronUp, GripVertical, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

interface DetailSectionConfigurationListProps {
  composition: ItemCompositionDefinition;
  onChange: (composition: ItemCompositionDefinition) => void;
}

function nextSectionId(sections: ReadonlyArray<DetailSectionDefinition>) {
  let sequence = sections.length + 1;
  while (sections.some((section) => section.id === `section-${sequence}`)) {
    sequence += 1;
  }
  return `section-${sequence}`;
}

function currentLayout(
  composition: ItemCompositionDefinition,
): DetailLayoutDefinition {
  return (
    composition.display.detailLayout ?? {
      schemaVersion: "configurable-detail-layout.v1",
      sections: [],
    }
  );
}

export function DetailSectionConfigurationList({
  composition,
  onChange,
}: DetailSectionConfigurationListProps) {
  const layout = currentLayout(composition);
  const [expandedSectionId, setExpandedSectionId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const setSections = (sections: ReadonlyArray<DetailSectionDefinition>) =>
    onChange({
      ...composition,
      display: {
        ...composition.display,
        detailLayout:
          sections.length > 0
            ? { schemaVersion: "configurable-detail-layout.v1", sections }
            : undefined,
      },
    });

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over) return;
    onChange(reorderDetailSections(composition, String(active.id), String(over.id)));
  };

  const addSection = () => {
    const id = nextSectionId(layout.sections);
    const firstField = composition.fields[0]?.name;
    if (!firstField) return;
    setSections([
      ...layout.sections,
      { id, type: "field-list", fields: [firstField], columns: 1 },
    ]);
    setExpandedSectionId(id);
  };

  return (
    <section className="composition-section" aria-labelledby="detail-sections-heading">
      <div className="composition-section-heading">
        <div>
          <h3 id="detail-sections-heading">詳細の表示順</h3>
          <span>{layout.sections.length}件</span>
        </div>
        <button
          className="button secondary compact"
          type="button"
          disabled={layout.sections.length >= DEFAULT_DETAIL_LAYOUT_POLICY.maxSections}
          onClick={addSection}
        >
          <Plus aria-hidden="true" size={16} />
          セクションを追加
        </button>
      </div>

      {layout.sections.length === 0 ? (
        <p className="configuration-empty">詳細セクションはありません。</p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={layout.sections.map((section) => section.id)}
            strategy={verticalListSortingStrategy}
          >
            <ol className="configuration-list">
              {layout.sections.map((section, index) => (
                <SortableDetailSection
                  key={section.id}
                  section={section}
                  fields={composition.fields}
                  position={index + 1}
                  expanded={expandedSectionId === section.id}
                  onToggle={() =>
                    setExpandedSectionId((current) =>
                      current === section.id ? null : section.id,
                    )
                  }
                  onChange={(nextSection) => {
                    setSections(
                      layout.sections.map((candidate) =>
                        candidate.id === section.id ? nextSection : candidate,
                      ),
                    );
                    if (nextSection.id !== section.id) {
                      setExpandedSectionId(nextSection.id);
                    }
                  }}
                  onDelete={() => {
                    setSections(
                      layout.sections.filter((candidate) => candidate.id !== section.id),
                    );
                    setExpandedSectionId(null);
                  }}
                />
              ))}
            </ol>
          </SortableContext>
        </DndContext>
      )}
    </section>
  );
}

interface SortableDetailSectionProps {
  section: DetailSectionDefinition;
  fields: ReadonlyArray<FieldDefinition>;
  position: number;
  expanded: boolean;
  onToggle: () => void;
  onChange: (section: DetailSectionDefinition) => void;
  onDelete: () => void;
}

function SortableDetailSection({
  section,
  fields,
  position,
  expanded,
  onToggle,
  onChange,
  onDelete,
}: SortableDetailSectionProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: section.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const textFields = fields.filter(
    (field) => field.type === "text" || field.type === "textarea",
  );

  const changeType = (type: DetailSectionDefinition["type"]) => {
    if (type === "field-list") {
      onChange({
        id: section.id,
        type,
        ...(section.title ? { title: section.title } : {}),
        fields: fields[0] ? [fields[0].name] : [],
        columns: 1,
      });
      return;
    }
    onChange({
      id: section.id,
      type,
      ...(section.title ? { title: section.title } : {}),
      source: { kind: "literal", markdown: "" },
    });
  };

  return (
    <li
      ref={setNodeRef}
      className={`configuration-item ${isDragging ? "dragging" : ""}`}
      style={style}
    >
      <div className="configuration-item-summary">
        <button
          className="icon-button drag-handle"
          type="button"
          aria-label={`${section.title || section.id}を並び替える。現在${position}番目`}
          title="並び替え"
          {...attributes}
          {...listeners}
        >
          <GripVertical aria-hidden="true" size={18} />
        </button>
        <button
          className="configuration-item-toggle"
          type="button"
          aria-expanded={expanded}
          onClick={onToggle}
        >
          <span>
            <strong>{section.title || "見出しなし"}</strong>
            <small>{section.id}</small>
          </span>
          <span className="field-type-label">
            {section.type === "field-list" ? "項目一覧" : "Markdown"}
          </span>
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        <button
          className="icon-button danger"
          type="button"
          aria-label={`${section.title || section.id}を削除`}
          title="削除"
          onClick={onDelete}
        >
          <Trash2 aria-hidden="true" size={16} />
        </button>
      </div>

      {expanded ? (
        <div className="configuration-item-editor">
          <div className="configuration-form-grid">
            <label className="config-control">
              <span>見出し</span>
              <input
                value={section.title ?? ""}
                maxLength={100}
                onChange={(event) =>
                  onChange({
                    ...section,
                    title: event.target.value || undefined,
                  } as DetailSectionDefinition)
                }
              />
            </label>
            <label className="config-control">
              <span>識別名</span>
              <input
                value={section.id}
                maxLength={64}
                onChange={(event) =>
                  onChange({ ...section, id: event.target.value } as DetailSectionDefinition)
                }
              />
            </label>
            <label className="config-control">
              <span>表示形式</span>
              <select
                value={section.type}
                onChange={(event) =>
                  changeType(event.target.value as DetailSectionDefinition["type"])
                }
              >
                <option value="field-list">項目一覧</option>
                <option value="markdown">Markdown</option>
              </select>
            </label>
          </div>

          {section.type === "field-list" ? (
            <>
              <label className="config-control narrow-control">
                <span>列数</span>
                <select
                  value={section.columns ?? 1}
                  onChange={(event) =>
                    onChange({
                      ...section,
                      columns: Number(event.target.value) === 2 ? 2 : 1,
                    })
                  }
                >
                  <option value={1}>1列</option>
                  <option value={2}>2列</option>
                </select>
              </label>
              <fieldset className="field-picker">
                <legend>表示する項目</legend>
                {fields.map((field) => (
                  <label key={field.name}>
                    <input
                      type="checkbox"
                      checked={section.fields.includes(field.name)}
                      onChange={(event) =>
                        onChange({
                          ...section,
                          fields: event.target.checked
                            ? [...section.fields, field.name]
                            : section.fields.filter((name) => name !== field.name),
                        })
                      }
                    />
                    {field.label}
                  </label>
                ))}
              </fieldset>
            </>
          ) : (
            <div className="markdown-source-editor">
              <label className="config-control narrow-control">
                <span>本文</span>
                <select
                  value={section.source.kind}
                  onChange={(event) => {
                    if (event.target.value === "field" && textFields[0]) {
                      onChange({
                        ...section,
                        source: { kind: "field", field: textFields[0].name },
                      });
                    } else {
                      onChange({
                        ...section,
                        source: { kind: "literal", markdown: "" },
                      });
                    }
                  }}
                >
                  <option value="literal">直接入力</option>
                  <option value="field" disabled={textFields.length === 0}>
                    入力項目から表示
                  </option>
                </select>
              </label>
              {section.source.kind === "field" ? (
                <label className="config-control">
                  <span>参照する項目</span>
                  <select
                    value={section.source.field}
                    onChange={(event) =>
                      onChange({
                        ...section,
                        source: { kind: "field", field: event.target.value },
                      })
                    }
                  >
                    {textFields.map((field) => (
                      <option key={field.name} value={field.name}>
                        {field.label}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <label className="config-control full">
                  <span>Markdown</span>
                  <textarea
                    value={section.source.markdown}
                    maxLength={20_000}
                    onChange={(event) =>
                      onChange({
                        ...section,
                        source: { kind: "literal", markdown: event.target.value },
                      })
                    }
                  />
                </label>
              )}
            </div>
          )}
        </div>
      ) : null}
    </li>
  );
}
