import type {
  DetailLayoutDefinition,
  DetailSectionDefinition,
} from "../detail-layout";
import type { FieldDefinition } from "../types";
import type { ItemCompositionDefinition } from "./types";

function moveArrayItem<T>(items: ReadonlyArray<T>, from: number, to: number): T[] {
  const nextItems = [...items];
  const [movedItem] = nextItems.splice(from, 1);
  if (movedItem === undefined) return nextItems;
  nextItems.splice(to, 0, movedItem);
  return nextItems;
}

function replaceFieldReference(
  fieldName: string | undefined,
  previousName: string,
  nextName: string,
) {
  return fieldName === previousName ? nextName : fieldName;
}

function replaceSectionFieldReference(
  section: DetailSectionDefinition,
  previousName: string,
  nextName: string,
): DetailSectionDefinition {
  if (section.type === "field-list") {
    return {
      ...section,
      fields: section.fields.map((fieldName) =>
        fieldName === previousName ? nextName : fieldName,
      ),
    };
  }
  if (section.source.kind === "field" && section.source.field === previousName) {
    return {
      ...section,
      source: { kind: "field", field: nextName },
    };
  }
  return section;
}

function mapDetailLayout(
  layout: DetailLayoutDefinition | undefined,
  mapSection: (section: DetailSectionDefinition) => DetailSectionDefinition | null,
) {
  if (!layout) return undefined;
  const sections = layout.sections
    .map(mapSection)
    .filter((section): section is DetailSectionDefinition => section !== null);
  return { ...layout, sections };
}

function nextAddedFieldsSectionId(layout: DetailLayoutDefinition) {
  const baseId = "added-fields";
  if (!layout.sections.some((section) => section.id === baseId)) return baseId;
  let sequence = 2;
  while (layout.sections.some((section) => section.id === `${baseId}-${sequence}`)) {
    sequence += 1;
  }
  return `${baseId}-${sequence}`;
}

export function appendCompositionField(
  composition: ItemCompositionDefinition,
  field: FieldDefinition,
): ItemCompositionDefinition {
  const layout = composition.display.detailLayout;
  if (!layout) {
    return { ...composition, fields: [...composition.fields, field] };
  }

  const fieldListIndex = layout.sections.findIndex(
    (section) => section.type === "field-list",
  );
  const sections = [...layout.sections];
  if (fieldListIndex >= 0) {
    const section = sections[fieldListIndex];
    if (section.type === "field-list") {
      sections[fieldListIndex] = {
        ...section,
        fields: [...section.fields, field.name],
      };
    }
  } else {
    sections.push({
      id: nextAddedFieldsSectionId(layout),
      type: "field-list",
      fields: [field.name],
      columns: 1,
    });
  }

  return {
    ...composition,
    fields: [...composition.fields, field],
    display: {
      ...composition.display,
      detailLayout: { ...layout, sections },
    },
  };
}

export function reorderCompositionFields(
  composition: ItemCompositionDefinition,
  activeName: string,
  overName: string,
): ItemCompositionDefinition {
  const previousIndex = composition.fields.findIndex(
    (field) => field.name === activeName,
  );
  const nextIndex = composition.fields.findIndex((field) => field.name === overName);
  if (previousIndex < 0 || nextIndex < 0 || previousIndex === nextIndex) {
    return composition;
  }
  return {
    ...composition,
    fields: moveArrayItem(composition.fields, previousIndex, nextIndex),
  };
}

export function replaceCompositionField(
  composition: ItemCompositionDefinition,
  previousName: string,
  nextField: FieldDefinition,
): ItemCompositionDefinition {
  const nextName = nextField.name;
  const nextLayout = mapDetailLayout(
    composition.display.detailLayout,
    (section) => replaceSectionFieldReference(section, previousName, nextName),
  );
  return {
    ...composition,
    fields: composition.fields.map((field) =>
      field.name === previousName ? nextField : field,
    ),
    creation: {
      initialTitle: {
        ...composition.creation.initialTitle,
        field:
          replaceFieldReference(
            composition.creation.initialTitle.field,
            previousName,
            nextName,
          ) ?? composition.creation.initialTitle.field,
      },
    },
    display: {
      ...composition.display,
      titleField:
        replaceFieldReference(
          composition.display.titleField,
          previousName,
          nextName,
        ) ?? composition.display.titleField,
      summaryField: replaceFieldReference(
        composition.display.summaryField,
        previousName,
        nextName,
      ),
      badgeField: replaceFieldReference(
        composition.display.badgeField,
        previousName,
        nextName,
      ),
      detailFields: composition.display.detailFields?.map((fieldName) =>
        fieldName === previousName ? nextName : fieldName,
      ),
      ...(nextLayout ? { detailLayout: nextLayout } : {}),
    },
  };
}

export function removeCompositionField(
  composition: ItemCompositionDefinition,
  fieldName: string,
): ItemCompositionDefinition {
  if (composition.fields.length <= 1) return composition;
  const nextFields = composition.fields.filter((field) => field.name !== fieldName);
  const firstTextField = nextFields.find(
    (field) => field.type === "text" || field.type === "textarea",
  );
  if (!firstTextField) return composition;

  const nextLayout = mapDetailLayout(composition.display.detailLayout, (section) => {
    if (section.type === "field-list") {
      const fields = section.fields.filter((name) => name !== fieldName);
      return fields.length > 0 ? { ...section, fields } : null;
    }
    return section.source.kind === "field" && section.source.field === fieldName
      ? null
      : section;
  });

  return {
    ...composition,
    fields: nextFields,
    creation: {
      initialTitle: {
        ...composition.creation.initialTitle,
        field:
          composition.creation.initialTitle.field === fieldName
            ? firstTextField.name
            : composition.creation.initialTitle.field,
      },
    },
    display: {
      ...composition.display,
      titleField:
        composition.display.titleField === fieldName
          ? firstTextField.name
          : composition.display.titleField,
      summaryField:
        composition.display.summaryField === fieldName
          ? undefined
          : composition.display.summaryField,
      badgeField:
        composition.display.badgeField === fieldName
          ? undefined
          : composition.display.badgeField,
      detailFields: composition.display.detailFields?.filter(
        (name) => name !== fieldName,
      ),
      ...(nextLayout && nextLayout.sections.length > 0
        ? { detailLayout: nextLayout }
        : { detailLayout: undefined }),
    },
  };
}

export function reorderDetailSections(
  composition: ItemCompositionDefinition,
  activeId: string,
  overId: string,
): ItemCompositionDefinition {
  const layout = composition.display.detailLayout;
  if (!layout) return composition;
  const previousIndex = layout.sections.findIndex((section) => section.id === activeId);
  const nextIndex = layout.sections.findIndex((section) => section.id === overId);
  if (previousIndex < 0 || nextIndex < 0 || previousIndex === nextIndex) {
    return composition;
  }
  return {
    ...composition,
    display: {
      ...composition.display,
      detailLayout: {
        ...layout,
        sections: moveArrayItem(layout.sections, previousIndex, nextIndex),
      },
    },
  };
}
