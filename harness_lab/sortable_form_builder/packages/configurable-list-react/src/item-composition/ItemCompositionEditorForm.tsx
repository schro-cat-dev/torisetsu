import { Braces, SlidersHorizontal } from "lucide-react";
import { useState, type FormEvent } from "react";
import {
  filterItemCompositionConfig,
  type ItemCompositionDefinition,
  type ItemCompositionIssue,
} from "@torisetsu/configurable-list-core";
import { ItemCompositionVisualEditor } from "./ItemCompositionVisualEditor";

export interface ItemCompositionEditorFormProps {
  initialDocument: string;
  onSubmit: (composition: ItemCompositionDefinition) => void;
  onCancel: () => void;
}

export function ItemCompositionEditorForm({
  initialDocument,
  onSubmit,
  onCancel,
}: ItemCompositionEditorFormProps) {
  const initialResult = filterItemCompositionConfig(initialDocument);
  const [mode, setMode] = useState<"visual" | "json">(
    initialResult.ok ? "visual" : "json",
  );
  const [composition, setComposition] = useState<ItemCompositionDefinition | null>(
    initialResult.ok ? initialResult.value : null,
  );
  const [document, setDocument] = useState(initialDocument);
  const [issues, setIssues] = useState<ReadonlyArray<ItemCompositionIssue>>([]);

  const showJsonEditor = () => {
    if (composition) setDocument(JSON.stringify(composition, null, 2));
    setIssues([]);
    setMode("json");
  };

  const showVisualEditor = () => {
    const result = filterItemCompositionConfig(document);
    if (!result.ok) {
      setIssues(result.issues);
      return;
    }
    setComposition(result.value);
    setIssues([]);
    setMode("visual");
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = filterItemCompositionConfig(
      mode === "visual" ? composition : document,
    );
    if (!result.ok) {
      setIssues(result.issues);
      return;
    }

    setIssues([]);
    onSubmit(result.value);
  };

  return (
    <form className="composition-editor-form" onSubmit={handleSubmit} noValidate>
      <div className="editor-mode-tabs" role="tablist" aria-label="構成の編集方法">
        <button
          className={mode === "visual" ? "active" : ""}
          type="button"
          role="tab"
          aria-selected={mode === "visual"}
          onClick={showVisualEditor}
        >
          <SlidersHorizontal aria-hidden="true" size={17} />
          画面編集
        </button>
        <button
          className={mode === "json" ? "active" : ""}
          type="button"
          role="tab"
          aria-selected={mode === "json"}
          onClick={showJsonEditor}
        >
          <Braces aria-hidden="true" size={17} />
          JSON編集
        </button>
      </div>

      {mode === "visual" && composition ? (
        <ItemCompositionVisualEditor
          composition={composition}
          onChange={(nextComposition) => {
            setComposition(nextComposition);
            setIssues([]);
          }}
        />
      ) : (
        <label className="json-editor-control" htmlFor="item-composition-document">
          <span>JSON構成</span>
          <textarea
            id="item-composition-document"
            value={document}
            spellCheck={false}
            aria-invalid={issues.length > 0}
            aria-describedby={
              issues.length > 0 ? "item-composition-errors" : undefined
            }
            onChange={(event) => {
              setDocument(event.target.value);
              setIssues([]);
            }}
          />
        </label>
      )}

      {issues.length > 0 ? (
        <div
          id="item-composition-errors"
          className="composition-editor-errors"
          role="alert"
        >
          <strong>構成を適用できません</strong>
          <ul>
            {issues.map((item, index) => (
              <li key={`${item.path}-${item.code}-${index}`}>
                <code>{item.path}</code>: {item.message}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="form-actions">
        <button className="button secondary" type="button" onClick={onCancel}>
          キャンセル
        </button>
        <button className="button primary" type="submit">
          新しい構成を適用
        </button>
      </div>
    </form>
  );
}
