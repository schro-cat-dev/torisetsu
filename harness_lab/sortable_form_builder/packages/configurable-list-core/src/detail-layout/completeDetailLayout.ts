import detailLayoutPolicy from "../../contracts/detail-layout.policy.json";
import type { FieldDefinition } from "../types";
import type {
  DetailLayoutDefinition,
  DetailSectionDefinition,
} from "./types";

function nextGeneratedSectionId(
  sections: ReadonlyArray<DetailSectionDefinition>,
) {
  const baseId = "unconfigured-fields";
  if (!sections.some((section) => section.id === baseId)) return baseId;
  let sequence = 2;
  while (sections.some((section) => section.id === `${baseId}-${sequence}`)) {
    sequence += 1;
  }
  return `${baseId}-${sequence}`;
}

export function completeDetailLayoutWithUnreferencedFields<
  FieldName extends string,
>(
  layout: DetailLayoutDefinition<FieldName>,
  fields: ReadonlyArray<FieldDefinition<FieldName>>,
): DetailLayoutDefinition<FieldName> {
  const representedFields = new Set<FieldName>();
  for (const section of layout.sections) {
    if (section.type === "field-list") {
      section.fields.forEach((fieldName) => representedFields.add(fieldName));
    } else if (section.source.kind === "field") {
      representedFields.add(section.source.field);
    }
  }

  const missingFields = fields
    .map((field) => field.name)
    .filter((fieldName) => !representedFields.has(fieldName));
  if (missingFields.length === 0) return layout;

  const sections: DetailSectionDefinition<FieldName>[] = layout.sections.map(
    (section) =>
      section.type === "field-list"
        ? { ...section, fields: [...section.fields] }
        : section,
  );
  let remainingFields = [...missingFields];

  for (const [index, section] of sections.entries()) {
    if (section.type !== "field-list" || remainingFields.length === 0) continue;
    const availableSlots = Math.max(
      detailLayoutPolicy.limits.maxFieldsPerSection - section.fields.length,
      0,
    );
    if (availableSlots === 0) continue;
    const fieldsToAppend = remainingFields.slice(0, availableSlots);
    remainingFields = remainingFields.slice(availableSlots);
    sections[index] = {
      ...section,
      fields: [...section.fields, ...fieldsToAppend],
    };
  }

  while (remainingFields.length > 0) {
    const fieldsForSection = remainingFields.slice(
      0,
      detailLayoutPolicy.limits.maxFieldsPerSection,
    );
    remainingFields = remainingFields.slice(
      detailLayoutPolicy.limits.maxFieldsPerSection,
    );
    sections.push({
      id: nextGeneratedSectionId(sections),
      type: "field-list",
      title: "その他の項目",
      fields: fieldsForSection,
      columns: 1,
    });
  }

  return { ...layout, sections };
}
