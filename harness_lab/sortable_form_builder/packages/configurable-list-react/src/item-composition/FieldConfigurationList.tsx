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
  DEFAULT_ITEM_COMPOSITION_POLICY,
  appendCompositionField,
  removeCompositionField,
  reorderCompositionFields,
  replaceCompositionField,
  type FieldDefinition,
  type ItemCompositionDefinition,
} from "@torisetsu/configurable-list-core";
import { ChevronDown, ChevronUp, GripVertical, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

interface FieldConfigurationListProps {
  composition: ItemCompositionDefinition;
  onChange: (composition: ItemCompositionDefinition) => void;
}

const fieldTypeLabels: Record<FieldDefinition["type"], string> = {
  text: "1行テキスト",
  textarea: "複数行テキスト",
  number: "数値",
  select: "選択肢",
  checkbox: "チェック",
};

function nextFieldName(fields: ReadonlyArray<FieldDefinition>) {
  let sequence = fields.length + 1;
  while (fields.some((field) => field.name === `field${sequence}`)) sequence += 1;
  return `field${sequence}`;
}

function convertFieldType(
  field: FieldDefinition,
  type: FieldDefinition["type"],
): FieldDefinition {
  const base = {
    name: field.name,
    label: field.label,
    ...(field.required === undefined ? {} : { required: field.required }),
    ...(field.description === undefined ? {} : { description: field.description }),
    ...(field.fullWidth === undefined ? {} : { fullWidth: field.fullWidth }),
  };
  switch (type) {
    case "text":
    case "textarea":
      return { ...base, type };
    case "number":
      return { ...base, type: "number", step: 1 };
    case "select":
      return {
        ...base,
        type: "select",
        options: [{ value: "option1", label: "選択肢1" }],
      };
    case "checkbox":
      return { ...base, type: "checkbox", defaultValue: false };
  }
}

function readOptionalNumber(value: string) {
  if (value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function FieldConfigurationList({
  composition,
  onChange,
}: FieldConfigurationListProps) {
  const [expandedFieldName, setExpandedFieldName] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over) return;
    onChange(
      reorderCompositionFields(composition, String(active.id), String(over.id)),
    );
  };

  const addField = () => {
    const name = nextFieldName(composition.fields);
    onChange(
      appendCompositionField(composition, {
        name,
        type: "text",
        label: `新しい項目${composition.fields.length + 1}`,
      }),
    );
    setExpandedFieldName(name);
  };

  return (
    <section className="composition-section" aria-labelledby="composition-fields-heading">
      <div className="composition-section-heading">
        <div>
          <h3 id="composition-fields-heading">入力項目</h3>
          <span>{composition.fields.length}件</span>
        </div>
        <button
          className="button secondary compact"
          type="button"
          disabled={composition.fields.length >= DEFAULT_ITEM_COMPOSITION_POLICY.maxFields}
          onClick={addField}
        >
          <Plus aria-hidden="true" size={16} />
          項目を追加
        </button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={composition.fields.map((field) => field.name)}
          strategy={verticalListSortingStrategy}
        >
          <ol className="configuration-list">
            {composition.fields.map((field, index) => (
              <SortableFieldConfiguration
                key={field.name}
                field={field}
                position={index + 1}
                expanded={expandedFieldName === field.name}
                canDelete={
                  composition.fields.length > 1 &&
                  ((field.type !== "text" && field.type !== "textarea") ||
                    composition.fields.filter(
                      (candidate) =>
                        candidate.type === "text" || candidate.type === "textarea",
                    ).length > 1)
                }
                canChangeToNonText={
                  (field.type !== "text" && field.type !== "textarea") ||
                  composition.fields.filter(
                    (candidate) =>
                      candidate.type === "text" || candidate.type === "textarea",
                  ).length > 1
                }
                onToggle={() =>
                  setExpandedFieldName((current) =>
                    current === field.name ? null : field.name,
                  )
                }
                onChange={(nextField) => {
                  onChange(
                    replaceCompositionField(composition, field.name, nextField),
                  );
                  if (nextField.name !== field.name) {
                    setExpandedFieldName(nextField.name);
                  }
                }}
                onDelete={() => {
                  onChange(removeCompositionField(composition, field.name));
                  setExpandedFieldName(null);
                }}
              />
            ))}
          </ol>
        </SortableContext>
      </DndContext>
    </section>
  );
}

interface SortableFieldConfigurationProps {
  field: FieldDefinition;
  position: number;
  expanded: boolean;
  canDelete: boolean;
  canChangeToNonText: boolean;
  onToggle: () => void;
  onChange: (field: FieldDefinition) => void;
  onDelete: () => void;
}

function SortableFieldConfiguration({
  field,
  position,
  expanded,
  canDelete,
  canChangeToNonText,
  onToggle,
  onChange,
  onDelete,
}: SortableFieldConfigurationProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: field.name });
  const style = { transform: CSS.Transform.toString(transform), transition };

  const patchCommon = (patch: Partial<FieldDefinition>) =>
    onChange({ ...field, ...patch } as FieldDefinition);

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
          aria-label={`${field.label}を並び替える。現在${position}番目`}
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
            <strong>{field.label || "名称未設定"}</strong>
            <small>{field.name || "識別名未設定"}</small>
          </span>
          <span className="field-type-label">{fieldTypeLabels[field.type]}</span>
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        <button
          className="icon-button danger"
          type="button"
          aria-label={`${field.label}を削除`}
          title={canDelete ? "削除" : "タイトル用の文字項目は1件必要です"}
          disabled={!canDelete}
          onClick={onDelete}
        >
          <Trash2 aria-hidden="true" size={16} />
        </button>
      </div>

      {expanded ? (
        <div className="configuration-item-editor">
          <div className="configuration-form-grid">
            <label className="config-control">
              <span>表示名</span>
              <input
                value={field.label}
                maxLength={100}
                onChange={(event) => patchCommon({ label: event.target.value })}
              />
            </label>
            <label className="config-control">
              <span>識別名</span>
              <input
                value={field.name}
                maxLength={64}
                onChange={(event) => patchCommon({ name: event.target.value })}
              />
            </label>
            <label className="config-control">
              <span>入力形式</span>
              <select
                value={field.type}
                onChange={(event) =>
                  onChange(
                    convertFieldType(
                      field,
                      event.target.value as FieldDefinition["type"],
                    ),
                  )
                }
              >
                {Object.entries(fieldTypeLabels).map(([value, label]) => (
                  <option
                    key={value}
                    value={value}
                    disabled={
                      !canChangeToNonText && value !== "text" && value !== "textarea"
                    }
                  >
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="config-control full">
              <span>説明</span>
              <input
                value={field.description ?? ""}
                maxLength={300}
                onChange={(event) =>
                  patchCommon({ description: event.target.value || undefined })
                }
              />
            </label>
          </div>

          <div className="config-checks">
            <label>
              <input
                type="checkbox"
                checked={field.required ?? false}
                onChange={(event) => patchCommon({ required: event.target.checked })}
              />
              必須
            </label>
            <label>
              <input
                type="checkbox"
                checked={field.fullWidth ?? false}
                onChange={(event) => patchCommon({ fullWidth: event.target.checked })}
              />
              横幅いっぱいに表示
            </label>
          </div>

          {(field.type === "text" || field.type === "textarea") && (
            <div className="configuration-form-grid">
              <label className="config-control full">
                <span>入力例</span>
                <input
                  value={field.placeholder ?? ""}
                  maxLength={300}
                  onChange={(event) =>
                    onChange({
                      ...field,
                      placeholder: event.target.value || undefined,
                    })
                  }
                />
              </label>
              <label className="config-control">
                <span>初期値</span>
                <input
                  value={field.defaultValue ?? ""}
                  onChange={(event) =>
                    onChange({ ...field, defaultValue: event.target.value })
                  }
                />
              </label>
              <label className="config-control">
                <span>最大文字数</span>
                <input
                  type="number"
                  min={1}
                  value={field.maxLength ?? ""}
                  onChange={(event) =>
                    onChange({
                      ...field,
                      maxLength: readOptionalNumber(event.target.value),
                    })
                  }
                />
              </label>
            </div>
          )}

          {field.type === "number" && (
            <div className="configuration-form-grid four-columns">
              {(["defaultValue", "min", "max", "step"] as const).map((key) => (
                <label className="config-control" key={key}>
                  <span>
                    {{ defaultValue: "初期値", min: "最小", max: "最大", step: "刻み" }[key]}
                  </span>
                  <input
                    type="number"
                    value={field[key] ?? ""}
                    onChange={(event) =>
                      onChange({
                        ...field,
                        [key]: readOptionalNumber(event.target.value),
                      })
                    }
                  />
                </label>
              ))}
            </div>
          )}

          {field.type === "select" && (
            <div className="option-editor">
              <div className="option-editor-heading">
                <strong>選択肢</strong>
                <button
                  className="button secondary compact"
                  type="button"
                  onClick={() =>
                    onChange({
                      ...field,
                      options: [
                        ...field.options,
                        {
                          value: `option${field.options.length + 1}`,
                          label: `選択肢${field.options.length + 1}`,
                        },
                      ],
                    })
                  }
                >
                  <Plus aria-hidden="true" size={15} />
                  追加
                </button>
              </div>
              {field.options.map((option, optionIndex) => (
                <div className="option-row" key={`${option.value}-${optionIndex}`}>
                  <label className="config-control">
                    <span>表示名</span>
                    <input
                      value={option.label}
                      onChange={(event) =>
                        onChange({
                          ...field,
                          options: field.options.map((candidate, index) =>
                            index === optionIndex
                              ? { ...candidate, label: event.target.value }
                              : candidate,
                          ),
                        })
                      }
                    />
                  </label>
                  <label className="config-control">
                    <span>値</span>
                    <input
                      value={option.value}
                      onChange={(event) =>
                        onChange({
                          ...field,
                          options: field.options.map((candidate, index) =>
                            index === optionIndex
                              ? { ...candidate, value: event.target.value }
                              : candidate,
                          ),
                        })
                      }
                    />
                  </label>
                  <button
                    className="icon-button danger"
                    type="button"
                    disabled={field.options.length <= 1}
                    aria-label={`${option.label}を削除`}
                    title="削除"
                    onClick={() =>
                      onChange({
                        ...field,
                        options: field.options.filter((_, index) => index !== optionIndex),
                      })
                    }
                  >
                    <Trash2 aria-hidden="true" size={15} />
                  </button>
                </div>
              ))}
              <label className="config-control">
                <span>初期選択</span>
                <select
                  value={field.defaultValue ?? ""}
                  onChange={(event) =>
                    onChange({
                      ...field,
                      defaultValue: event.target.value || undefined,
                    })
                  }
                >
                  <option value="">指定なし</option>
                  {field.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}

          {field.type === "checkbox" && (
            <div className="config-checks">
              <label>
                <input
                  type="checkbox"
                  checked={field.defaultValue ?? false}
                  onChange={(event) =>
                    onChange({ ...field, defaultValue: event.target.checked })
                  }
                />
                最初から選択済みにする
              </label>
            </div>
          )}
        </div>
      ) : null}
    </li>
  );
}
