import { useMemo } from "react";
import ReactMarkdown, { defaultUrlTransform } from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  DEFAULT_DETAIL_LAYOUT_POLICY,
  filterDetailLayoutConfig,
  sanitizeMarkdownForDisplay,
  type ConfigurableItem,
  type DetailLayoutDefinition,
  type DetailLayoutPolicy,
  type FieldDefinition,
  type FieldValue,
  type FieldListDetailSection,
  type MarkdownDetailSection,
} from "@torisetsu/configurable-list-core";

export interface DetailLayoutRendererProps<FieldName extends string> {
  layout: unknown;
  fields: ReadonlyArray<FieldDefinition<FieldName>>;
  item: ConfigurableItem<FieldName>;
  policy?: DetailLayoutPolicy;
}

export interface ValidatedDetailLayoutRendererProps<FieldName extends string> {
  layout: DetailLayoutDefinition<FieldName>;
  fields: ReadonlyArray<FieldDefinition<FieldName>>;
  item: ConfigurableItem<FieldName>;
  policy?: DetailLayoutPolicy;
}

const MARKDOWN_ELEMENTS = [
  "p",
  "strong",
  "em",
  "del",
  "ul",
  "ol",
  "li",
  "blockquote",
  "code",
  "pre",
  "a",
  "hr",
  "br",
  "h3",
  "h4",
  "h5",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
] as const;

function formatFieldValue<FieldName extends string>(
  field: FieldDefinition<FieldName>,
  value: FieldValue | undefined,
) {
  if (field.type === "checkbox") {
    return value === true ? "はい" : "いいえ";
  }

  if (field.type === "select") {
    return (
      field.options.find((option) => option.value === value)?.label ??
      String(value || "未入力")
    );
  }

  return value === "" || value === undefined ? "未入力" : String(value);
}

function filterMarkdownUrl(url: string, policy: DetailLayoutPolicy) {
  const safeUrl = defaultUrlTransform(url);
  if (!safeUrl || safeUrl.startsWith("//")) {
    return "";
  }

  const protocolMatch = safeUrl.match(/^([a-z][a-z0-9+.-]*):/i);
  if (!protocolMatch) {
    return safeUrl;
  }

  return policy.allowedLinkProtocols.includes(protocolMatch[1].toLowerCase())
    ? safeUrl
    : "";
}

function FieldListSection<FieldName extends string>({
  section,
  fieldsByName,
  item,
}: {
  section: FieldListDetailSection<FieldName>;
  fieldsByName: ReadonlyMap<FieldName, FieldDefinition<FieldName>>;
  item: ConfigurableItem<FieldName>;
}) {
  return (
    <section className="detail-layout-section">
      {section.title ? <h3>{section.title}</h3> : null}
      <dl
        className="detail-field-list"
        data-columns={section.columns ?? 1}
      >
        {section.fields.map((fieldName) => {
          const field = fieldsByName.get(fieldName);
          if (!field) {
            return null;
          }

          return (
            <div key={field.name}>
              <dt>{field.label}</dt>
              <dd>{formatFieldValue(field, item.values[field.name])}</dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}

function MarkdownSection<FieldName extends string>({
  section,
  item,
  policy,
}: {
  section: MarkdownDetailSection<FieldName>;
  item: ConfigurableItem<FieldName>;
  policy: DetailLayoutPolicy;
}) {
  const sourceMarkdown =
    section.source.kind === "literal"
      ? section.source.markdown
      : item.values[section.source.field];
  const sanitizedMarkdown = useMemo(
    () =>
      typeof sourceMarkdown === "string" &&
      sourceMarkdown.length <= policy.maxMarkdownCharacters
        ? sanitizeMarkdownForDisplay(sourceMarkdown, policy).markdown
        : null,
    [policy, sourceMarkdown],
  );

  if (sanitizedMarkdown === null) {
    return (
      <section className="detail-layout-section">
        {section.title ? <h3>{section.title}</h3> : null}
        <p className="detail-layout-error" role="alert">
          この内容は表示条件を満たしていません。
        </p>
      </section>
    );
  }

  return (
    <section className="detail-layout-section">
      {section.title ? <h3>{section.title}</h3> : null}
      <div className="detail-markdown">
        <ReactMarkdown
          allowedElements={[...MARKDOWN_ELEMENTS]}
          remarkPlugins={[remarkGfm]}
          skipHtml
          urlTransform={(url) => filterMarkdownUrl(url, policy)}
        >
          {sanitizedMarkdown}
        </ReactMarkdown>
      </div>
    </section>
  );
}

const DETAIL_SECTION_COMPONENTS = Object.freeze({
  markdown: MarkdownSection,
  "field-list": FieldListSection,
});

export function ValidatedDetailLayoutRenderer<FieldName extends string>({
  layout,
  fields,
  item,
  policy = DEFAULT_DETAIL_LAYOUT_POLICY,
}: ValidatedDetailLayoutRendererProps<FieldName>) {
  const fieldsByName = useMemo(
    () => new Map(fields.map((field) => [field.name, field])),
    [fields],
  );

  return (
    <div className="detail-layout" data-layout-status="valid">
      {layout.sections.map((section) => {
        if (section.type === "markdown") {
          const MarkdownRenderer = DETAIL_SECTION_COMPONENTS.markdown;
          return (
            <MarkdownRenderer
              key={section.id}
              section={section}
              item={item}
              policy={policy}
            />
          );
        }

        const FieldListRenderer = DETAIL_SECTION_COMPONENTS["field-list"];
        return (
          <FieldListRenderer
            key={section.id}
            section={section}
            fieldsByName={fieldsByName}
            item={item}
          />
        );
      })}
    </div>
  );
}

export function DetailLayoutRenderer<FieldName extends string>({
  layout,
  fields,
  item,
  policy = DEFAULT_DETAIL_LAYOUT_POLICY,
}: DetailLayoutRendererProps<FieldName>) {
  const filteredLayout = useMemo(
    () => filterDetailLayoutConfig(layout, fields, policy),
    [fields, layout, policy],
  );
  if (!filteredLayout.ok) {
    return (
      <div className="detail-layout-error" role="alert" data-layout-status="invalid">
        詳細の表示設定を読み込めませんでした。
      </div>
    );
  }

  return (
    <ValidatedDetailLayoutRenderer
      layout={filteredLayout.value}
      fields={fields}
      item={item}
      policy={policy}
    />
  );
}
