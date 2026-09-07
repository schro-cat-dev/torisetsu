import type {
  JsonDocumentFormat,
  JsonInputBoundaryIssue,
  JsonInputBoundaryIssueCode,
  JsonInputBoundaryPolicy,
  JsonInputBoundaryResult,
} from "./types";

const SUPPORTED_DOCUMENT_FORMATS = new Set<JsonDocumentFormat>([
  "json",
  "markdown-json-fence",
]);
const UNSAFE_PROPERTY_NAMES = new Set(["__proto__", "prototype", "constructor"]);

function issue(
  code: JsonInputBoundaryIssueCode,
  path: string,
  message: string,
): JsonInputBoundaryIssue {
  return { code, path, message };
}

function validatePolicy(policy: JsonInputBoundaryPolicy): JsonInputBoundaryIssue | null {
  if (
    !Array.isArray(policy.acceptedDocumentFormats) ||
    policy.acceptedDocumentFormats.length === 0 ||
    policy.acceptedDocumentFormats.some(
      (format) => !SUPPORTED_DOCUMENT_FORMATS.has(format),
    )
  ) {
    return issue(
      "invalid_boundary_policy",
      "$.policy.acceptedDocumentFormats",
      "acceptedDocumentFormatsには対応済み形式を1件以上指定してください",
    );
  }

  const positiveIntegerKeys = [
    "maxDocumentCharacters",
    "maxNodeCount",
    "maxTotalStringCharacters",
  ] as const;
  for (const key of positiveIntegerKeys) {
    if (!Number.isSafeInteger(policy[key]) || policy[key] < 1) {
      return issue(
        "invalid_boundary_policy",
        `$.policy.${key}`,
        `${key}は1以上の安全な整数で指定してください`,
      );
    }
  }

  if (!Number.isSafeInteger(policy.maxNestingDepth) || policy.maxNestingDepth < 0) {
    return issue(
      "invalid_boundary_policy",
      "$.policy.maxNestingDepth",
      "maxNestingDepthは0以上の安全な整数で指定してください",
    );
  }

  return null;
}

function parseDocument(
  input: string,
  policy: JsonInputBoundaryPolicy,
):
  | { ok: true; value: unknown; documentFormat: JsonDocumentFormat }
  | { ok: false; issue: JsonInputBoundaryIssue } {
  if (input.length > policy.maxDocumentCharacters) {
    return {
      ok: false,
      issue: issue(
        "document_too_large",
        "$",
        `JSON文書は${policy.maxDocumentCharacters}文字以内にしてください`,
      ),
    };
  }

  const trimmedInput = input.trim();
  const fencedMatch = trimmedInput.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?```$/i);
  const documentFormat: JsonDocumentFormat = fencedMatch
    ? "markdown-json-fence"
    : "json";
  if (!policy.acceptedDocumentFormats.includes(documentFormat)) {
    return {
      ok: false,
      issue: issue(
        "unsupported_document_format",
        "$",
        `未対応の入力形式です: ${documentFormat}`,
      ),
    };
  }

  try {
    return {
      ok: true,
      value: JSON.parse(fencedMatch?.[1] ?? trimmedInput) as unknown,
      documentFormat,
    };
  } catch {
    return {
      ok: false,
      issue: issue("invalid_json", "$", "有効なJSON文書ではありません"),
    };
  }
}

function childPath(parentPath: string, parent: object, key: string) {
  return Array.isArray(parent) ? `${parentPath}[${key}]` : `${parentPath}.${key}`;
}

function inspectJsonValue(
  value: unknown,
  policy: JsonInputBoundaryPolicy,
):
  | {
      ok: true;
      nodeCount: number;
      totalStringCharacters: number;
      maxDepthObserved: number;
    }
  | { ok: false; issue: JsonInputBoundaryIssue } {
  const pending: Array<{
    value: unknown;
    path: string;
    depth: number;
    ancestors: ReadonlyArray<object>;
  }> = [{ value, path: "$", depth: 0, ancestors: [] }];
  let nodeCount = 0;
  let totalStringCharacters = 0;
  let maxDepthObserved = 0;

  while (pending.length > 0) {
    const current = pending.pop();
    if (!current) continue;

    nodeCount += 1;
    if (nodeCount > policy.maxNodeCount) {
      return {
        ok: false,
        issue: issue(
          "node_limit_exceeded",
          current.path,
          `JSONの値は${policy.maxNodeCount}要素以内にしてください`,
        ),
      };
    }
    maxDepthObserved = Math.max(maxDepthObserved, current.depth);
    if (current.depth > policy.maxNestingDepth) {
      return {
        ok: false,
        issue: issue(
          "nesting_too_deep",
          current.path,
          `JSONのネストは${policy.maxNestingDepth}階層以内にしてください`,
        ),
      };
    }

    if (typeof current.value === "string") {
      totalStringCharacters += current.value.length;
    } else if (
      current.value === null ||
      typeof current.value === "boolean" ||
      (typeof current.value === "number" && Number.isFinite(current.value))
    ) {
      // JSON primitive.
    } else if (typeof current.value !== "object") {
      return {
        ok: false,
        issue: issue(
          "invalid_json_value",
          current.path,
          "JSONで表現できる値だけを指定してください",
        ),
      };
    } else {
      if (current.ancestors.includes(current.value)) {
        return {
          ok: false,
          issue: issue("cyclic_value", current.path, "循環参照は指定できません"),
        };
      }

      const prototype = Object.getPrototypeOf(current.value);
      if (
        !Array.isArray(current.value) &&
        prototype !== Object.prototype &&
        prototype !== null
      ) {
        return {
          ok: false,
          issue: issue(
            "invalid_json_value",
            current.path,
            "plain objectまたはarrayを指定してください",
          ),
        };
      }

      const ownKeys = Reflect.ownKeys(current.value);
      const childCount = Array.isArray(current.value)
        ? Math.max(ownKeys.length - 1, current.value.length)
        : ownKeys.length;
      if (nodeCount + childCount > policy.maxNodeCount) {
        return {
          ok: false,
          issue: issue(
            "node_limit_exceeded",
            current.path,
            `JSONの値は${policy.maxNodeCount}要素以内にしてください`,
          ),
        };
      }
      const descriptors = Object.getOwnPropertyDescriptors(current.value);
      for (const ownKey of ownKeys) {
        if (typeof ownKey !== "string") {
          return {
            ok: false,
            issue: issue(
              "invalid_json_value",
              current.path,
              "Symbol propertyは指定できません",
            ),
          };
        }
        if (Array.isArray(current.value) && ownKey === "length") continue;
        if (
          Array.isArray(current.value) &&
          (!/^(0|[1-9][0-9]*)$/.test(ownKey) ||
            Number(ownKey) >= current.value.length)
        ) {
          return {
            ok: false,
            issue: issue(
              "invalid_json_value",
              `${current.path}.${ownKey}`,
              "arrayには添字以外のpropertyを指定できません",
            ),
          };
        }
        const descriptor = descriptors[ownKey];
        if (!descriptor?.enumerable || descriptor.get || descriptor.set) {
          return {
            ok: false,
            issue: issue(
              "invalid_json_value",
              childPath(current.path, current.value, ownKey),
              "列挙可能なdata propertyだけを指定してください",
            ),
          };
        }
      }

      const keys = Object.keys(current.value);
      if (Array.isArray(current.value)) {
        for (let index = 0; index < current.value.length; index += 1) {
          if (!Object.hasOwn(current.value, index)) {
            return {
              ok: false,
              issue: issue(
                "invalid_json_value",
                `${current.path}[${index}]`,
                "欠けたarray要素は指定できません",
              ),
            };
          }
        }
      } else {
        totalStringCharacters += keys.reduce((total, key) => total + key.length, 0);
      }

      const ancestors = [...current.ancestors, current.value];
      for (const key of keys) {
        const path = childPath(current.path, current.value, key);
        if (UNSAFE_PROPERTY_NAMES.has(key)) {
          return {
            ok: false,
            issue: issue("unsafe_property", path, "安全でないproperty名です"),
          };
        }
        pending.push({
          value: descriptors[key]?.value,
          path,
          depth: current.depth + 1,
          ancestors,
        });
      }
    }

    if (totalStringCharacters > policy.maxTotalStringCharacters) {
      return {
        ok: false,
        issue: issue(
          "string_content_too_large",
          current.path,
          `JSON内の文字列合計は${policy.maxTotalStringCharacters}文字以内にしてください`,
        ),
      };
    }
  }

  return { ok: true, nodeCount, totalStringCharacters, maxDepthObserved };
}

function cloneJsonValue(value: unknown): unknown {
  return JSON.parse(JSON.stringify(value)) as unknown;
}

export function filterJsonInputAtBoundary(
  input: unknown,
  policy: JsonInputBoundaryPolicy,
): JsonInputBoundaryResult {
  const policyIssue = validatePolicy(policy);
  if (policyIssue) return { ok: false, issues: [policyIssue] };

  const parsed =
    typeof input === "string"
      ? parseDocument(input, policy)
      : { ok: true as const, value: input };
  if (!parsed.ok) return { ok: false, issues: [parsed.issue] };

  try {
    const inspected = inspectJsonValue(parsed.value, policy);
    if (!inspected.ok) return { ok: false, issues: [inspected.issue] };

    return {
      ok: true,
      value: cloneJsonValue(parsed.value),
      issues: [],
      inputKind: typeof input === "string" ? "document" : "object",
      ...("documentFormat" in parsed
        ? { documentFormat: parsed.documentFormat }
        : {}),
      nodeCount: inspected.nodeCount,
      totalStringCharacters: inspected.totalStringCharacters,
      maxDepthObserved: inspected.maxDepthObserved,
    };
  } catch {
    return {
      ok: false,
      issues: [
        issue(
          "invalid_json_value",
          "$",
          "入力値を安全なJSON dataとして読み取れませんでした",
        ),
      ],
    };
  }
}
