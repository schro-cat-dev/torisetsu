import type { CSSProperties } from "react";
import { useState } from "react";
import type { CategoryFilter, TodoCategory, TodoCategoryInput } from "../types";
import { CATEGORY_COLOR_OPTIONS, DEFAULT_CATEGORY_COLOR } from "../utils/categoryColors";

type TodoCategoryBarProps = {
  categories: TodoCategory[];
  categoryFilter: CategoryFilter;
  isSaving: boolean;
  onCategoryFilterChange: (value: CategoryFilter) => void;
  onCategoryCreate: (input: TodoCategoryInput) => Promise<TodoCategory>;
};

export function TodoCategoryBar({
  categories,
  categoryFilter,
  isSaving,
  onCategoryFilterChange,
  onCategoryCreate
}: TodoCategoryBarProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState<string>(DEFAULT_CATEGORY_COLOR);

  async function handleAddCategory() {
    const category = await onCategoryCreate({ name: name.trim(), color });
    onCategoryFilterChange(category.id);
    setName("");
    setColor(DEFAULT_CATEGORY_COLOR);
    setIsAdding(false);
  }

  return (
    <section className="category-bar" aria-label="分類">
      <div className="category-scroll" aria-label="分類一覧">
        <button
          type="button"
          className={`category-chip ${categoryFilter === "all" ? "is-selected" : ""}`}
          aria-pressed={categoryFilter === "all"}
          aria-label="分類: すべて"
          onClick={() => onCategoryFilterChange("all")}
        >
          すべて
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            className={`category-chip ${categoryFilter === category.id ? "is-selected" : ""}`}
            style={{ "--category-color": category.color } as CSSProperties}
            aria-pressed={categoryFilter === category.id}
            aria-label={`分類: ${category.name}`}
            onClick={() => onCategoryFilterChange(category.id)}
          >
            <span className="category-dot" aria-hidden="true" />
            {category.name}
          </button>
        ))}
        <button
          type="button"
          className="category-chip add"
          aria-expanded={isAdding}
          onClick={() => setIsAdding((current) => !current)}
        >
          分類追加
        </button>
      </div>
      {isAdding ? (
        <div className="category-add-form" aria-label="分類追加">
          <input
            aria-label="分類バーに追加する分類名"
            value={name}
            maxLength={24}
            placeholder="分類名"
            onChange={(event) => setName(event.target.value)}
          />
          <div className="color-picker compact" aria-label="分類バーの分類色">
            {CATEGORY_COLOR_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`color-swatch-button ${color === option.value ? "is-selected" : ""}`}
                style={{ "--category-color": option.value } as CSSProperties}
                aria-label={`分類バーの分類色: ${option.label}`}
                aria-pressed={color === option.value}
                onClick={() => setColor(option.value)}
              />
            ))}
          </div>
          <button
            type="button"
            className="button secondary"
            disabled={isSaving || !name.trim()}
            onClick={handleAddCategory}
          >
            追加
          </button>
        </div>
      ) : null}
    </section>
  );
}
