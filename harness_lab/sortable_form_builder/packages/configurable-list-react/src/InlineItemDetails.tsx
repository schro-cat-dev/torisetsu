import type {
  CollectionDefinition,
  ConfigurableItem,
  DetailLayoutDefinition,
} from "@torisetsu/configurable-list-core";
import {
  DetailLayoutRenderer,
  ValidatedDetailLayoutRenderer,
} from "./detail-layout";

export interface InlineItemDetailsProps<FieldName extends string> {
  definition: CollectionDefinition<FieldName>;
  item: ConfigurableItem<FieldName>;
  layout?: DetailLayoutDefinition<FieldName>;
  layoutError?: boolean;
}

export function InlineItemDetails<FieldName extends string>({
  definition,
  item,
  layout,
  layoutError = false,
}: InlineItemDetailsProps<FieldName>) {
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

  return (
    <div className="inline-item-details" aria-label={`${definition.itemLabel}の詳細`}>
      {layoutError ? (
        <p className="detail-layout-error" role="alert">
          詳細の表示設定を読み込めませんでした。
        </p>
      ) : layout ? (
        <ValidatedDetailLayoutRenderer
          layout={layout}
          fields={definition.fields}
          item={item}
        />
      ) : (
        <DetailLayoutRenderer
          layout={definition.display.detailLayout ?? fallbackLayout}
          fields={definition.fields}
          item={item}
        />
      )}
    </div>
  );
}
