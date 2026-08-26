export const CATEGORY_COLOR_OPTIONS = [
  { value: "#2563eb", label: "青" },
  { value: "#16a34a", label: "緑" },
  { value: "#ea580c", label: "オレンジ" },
  { value: "#9333ea", label: "紫" },
  { value: "#be123c", label: "赤" },
  { value: "#475569", label: "グレー" }
] as const;

export const DEFAULT_CATEGORY_COLOR = CATEGORY_COLOR_OPTIONS[0].value;
