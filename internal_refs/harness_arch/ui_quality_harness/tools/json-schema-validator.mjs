import { readFile } from "node:fs/promises";

const ANNOTATION_KEYS = new Set(["$schema", "$id", "title", "description", "default", "examples"]);
const VALIDATION_KEYS = new Set([
  "type",
  "const",
  "enum",
  "required",
  "properties",
  "additionalProperties",
  "items",
  "minItems",
  "maxItems",
  "uniqueItems",
  "minLength",
  "maxLength",
  "pattern",
  "minimum",
  "maximum",
  "minProperties",
  "maxProperties"
]);

export async function readJsonFile(filePath) {
  const text = await readFile(filePath, "utf8");
  try {
    return JSON.parse(text);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`${filePath}: invalid JSON: ${detail}`);
  }
}

export function validateJsonSchema(value, schema, rootPath = "$") {
  const issues = [];
  validateNode(value, schema, rootPath, issues);
  return issues;
}

export function assertJsonSchema(value, schema, label = "input") {
  const issues = validateJsonSchema(value, schema);
  if (issues.length > 0) {
    const detail = issues.map((issue) => `${issue.path}: ${issue.message}`).join("\n");
    throw new Error(`${label} does not satisfy its JSON Schema:\n${detail}`);
  }
}

function validateNode(value, schema, currentPath, issues) {
  if (!isPlainObject(schema)) {
    issues.push({ path: currentPath, message: "schema node must be an object" });
    return;
  }

  for (const key of Object.keys(schema)) {
    if (!ANNOTATION_KEYS.has(key) && !VALIDATION_KEYS.has(key)) {
      issues.push({ path: currentPath, message: `unsupported schema keyword: ${key}` });
    }
  }

  if (Object.hasOwn(schema, "const") && !deepEqual(value, schema.const)) {
    issues.push({ path: currentPath, message: `must equal ${JSON.stringify(schema.const)}` });
  }

  if (Array.isArray(schema.enum) && !schema.enum.some((candidate) => deepEqual(value, candidate))) {
    issues.push({ path: currentPath, message: `must be one of ${schema.enum.map((item) => JSON.stringify(item)).join(", ")}` });
  }

  if (schema.type && !matchesType(value, schema.type)) {
    issues.push({ path: currentPath, message: `must be ${schema.type}` });
    return;
  }

  if (schema.type === "object") validateObject(value, schema, currentPath, issues);
  if (schema.type === "array") validateArray(value, schema, currentPath, issues);
  if (schema.type === "string") validateString(value, schema, currentPath, issues);
  if (schema.type === "number" || schema.type === "integer") validateNumber(value, schema, currentPath, issues);
}

function validateObject(value, schema, currentPath, issues) {
  const keys = Object.keys(value);
  const properties = isPlainObject(schema.properties) ? schema.properties : {};

  if (Number.isInteger(schema.minProperties) && keys.length < schema.minProperties) {
    issues.push({ path: currentPath, message: `must contain at least ${schema.minProperties} properties` });
  }
  if (Number.isInteger(schema.maxProperties) && keys.length > schema.maxProperties) {
    issues.push({ path: currentPath, message: `must contain at most ${schema.maxProperties} properties` });
  }

  for (const requiredKey of schema.required ?? []) {
    if (!Object.hasOwn(value, requiredKey)) {
      issues.push({ path: `${currentPath}.${requiredKey}`, message: "is required" });
    }
  }

  for (const [key, childValue] of Object.entries(value)) {
    const childPath = `${currentPath}.${key}`;
    if (Object.hasOwn(properties, key)) {
      validateNode(childValue, properties[key], childPath, issues);
      continue;
    }
    if (schema.additionalProperties === false) {
      issues.push({ path: childPath, message: "is not allowed" });
    } else if (isPlainObject(schema.additionalProperties)) {
      validateNode(childValue, schema.additionalProperties, childPath, issues);
    }
  }
}

function validateArray(value, schema, currentPath, issues) {
  if (Number.isInteger(schema.minItems) && value.length < schema.minItems) {
    issues.push({ path: currentPath, message: `must contain at least ${schema.minItems} items` });
  }
  if (Number.isInteger(schema.maxItems) && value.length > schema.maxItems) {
    issues.push({ path: currentPath, message: `must contain at most ${schema.maxItems} items` });
  }
  if (schema.uniqueItems === true) {
    const encoded = value.map((item) => stableStringify(item));
    if (new Set(encoded).size !== encoded.length) {
      issues.push({ path: currentPath, message: "must contain unique items" });
    }
  }
  if (isPlainObject(schema.items)) {
    value.forEach((item, index) => validateNode(item, schema.items, `${currentPath}[${index}]`, issues));
  }
}

function validateString(value, schema, currentPath, issues) {
  if (Number.isInteger(schema.minLength) && value.length < schema.minLength) {
    issues.push({ path: currentPath, message: `length must be at least ${schema.minLength}` });
  }
  if (Number.isInteger(schema.maxLength) && value.length > schema.maxLength) {
    issues.push({ path: currentPath, message: `length must be at most ${schema.maxLength}` });
  }
  if (typeof schema.pattern === "string" && !new RegExp(schema.pattern, "u").test(value)) {
    issues.push({ path: currentPath, message: `must match ${schema.pattern}` });
  }
}

function validateNumber(value, schema, currentPath, issues) {
  if (typeof schema.minimum === "number" && value < schema.minimum) {
    issues.push({ path: currentPath, message: `must be >= ${schema.minimum}` });
  }
  if (typeof schema.maximum === "number" && value > schema.maximum) {
    issues.push({ path: currentPath, message: `must be <= ${schema.maximum}` });
  }
}

function matchesType(value, type) {
  if (type === "object") return isPlainObject(value);
  if (type === "array") return Array.isArray(value);
  if (type === "integer") return Number.isInteger(value);
  if (type === "number") return typeof value === "number" && Number.isFinite(value);
  if (type === "null") return value === null;
  return typeof value === type;
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function deepEqual(left, right) {
  return stableStringify(left) === stableStringify(right);
}

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (isPlainObject(value)) {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}
