import type { ItemCompositionDefinition } from "@torisetsu/configurable-list-core";
import { DetailSectionConfigurationList } from "./DetailSectionConfigurationList";
import { FieldConfigurationList } from "./FieldConfigurationList";

export interface ItemCompositionVisualEditorProps {
  composition: ItemCompositionDefinition;
  onChange: (composition: ItemCompositionDefinition) => void;
}

export function ItemCompositionVisualEditor({
  composition,
  onChange,
}: ItemCompositionVisualEditorProps) {
  const textFields = composition.fields.filter(
    (field) => field.type === "text" || field.type === "textarea",
  );

  return (
    <div className="composition-visual-editor">
      <section className="composition-section" aria-labelledby="display-settings-heading">
        <div className="composition-section-heading">
          <h3 id="display-settings-heading">一覧表示</h3>
        </div>
        <div className="configuration-form-grid three-columns">
          <label className="config-control">
            <span>タイトル</span>
            <select
              value={composition.display.titleField}
              onChange={(event) =>
                onChange({
                  ...composition,
                  display: { ...composition.display, titleField: event.target.value },
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
          <label className="config-control">
            <span>概要</span>
            <select
              value={composition.display.summaryField ?? ""}
              onChange={(event) =>
                onChange({
                  ...composition,
                  display: {
                    ...composition.display,
                    summaryField: event.target.value || undefined,
                  },
                })
              }
            >
              <option value="">表示しない</option>
              {textFields.map((field) => (
                <option key={field.name} value={field.name}>
                  {field.label}
                </option>
              ))}
            </select>
          </label>
          <label className="config-control">
            <span>バッジ</span>
            <select
              value={composition.display.badgeField ?? ""}
              onChange={(event) =>
                onChange({
                  ...composition,
                  display: {
                    ...composition.display,
                    badgeField: event.target.value || undefined,
                  },
                })
              }
            >
              <option value="">表示しない</option>
              {composition.fields.map((field) => (
                <option key={field.name} value={field.name}>
                  {field.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="composition-section" aria-labelledby="new-item-settings-heading">
        <div className="composition-section-heading">
          <h3 id="new-item-settings-heading">新規追加</h3>
        </div>
        <div className="configuration-form-grid">
          <label className="config-control">
            <span>名前を入れる項目</span>
            <select
              value={composition.creation.initialTitle.field}
              onChange={(event) =>
                onChange({
                  ...composition,
                  creation: {
                    initialTitle: {
                      ...composition.creation.initialTitle,
                      field: event.target.value,
                    },
                  },
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
          <label className="config-control">
            <span>最初の名前</span>
            <input
              value={composition.creation.initialTitle.value}
              onChange={(event) =>
                onChange({
                  ...composition,
                  creation: {
                    initialTitle: {
                      ...composition.creation.initialTitle,
                      value: event.target.value,
                    },
                  },
                })
              }
            />
          </label>
        </div>
      </section>

      <FieldConfigurationList composition={composition} onChange={onChange} />
      <DetailSectionConfigurationList
        composition={composition}
        onChange={onChange}
      />
    </div>
  );
}
