import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const configPath = process.argv[2];
const recordPath = process.argv[3];
const root = process.cwd();

if (!configPath || !recordPath) {
  throw new Error("Usage: node run-completion-score.mjs <config.json> <completion-record.json>");
}

const config = JSON.parse(await readFile(join(root, configPath), "utf8"));
const record = JSON.parse(await readFile(join(root, recordPath), "utf8"));

validateConfig(config);
validateRecord(record);

const checks = config.items.map((item) => {
  const actual = getValue(record, item.field);
  const passed = compare(actual, item.operator, item.value);
  return {
    id: item.id,
    field: item.field,
    actual,
    operator: item.operator,
    expected: item.value,
    weight: item.weight,
    severity: item.severity,
    passed,
    message: item.message
  };
});

const earned = checks.reduce((sum, check) => sum + (check.passed ? check.weight : 0), 0);
const total = checks.reduce((sum, check) => sum + check.weight, 0);
const score = Math.round((earned / total) * 100);
const failed = checks.filter((check) => !check.passed);
const hardFailed = failed.some((check) => check.severity === "BLOCK");
const status = hardFailed ? "BLOCK" : decideStatus(score, config.statusBands);
const actionItems = config.actions
  .filter((action) => action.status === status)
  .flatMap((action) => action.items);

const output = {
  schemaVersion: "execution-completion-score-result.v1",
  generatedAt: new Date().toISOString(),
  configPath,
  recordPath,
  taskId: record.task.taskId,
  taskTitle: record.task.title,
  status,
  score,
  earned,
  total,
  checks,
  actionItems
};

await mkdir(dirname(join(root, config.output.file)), { recursive: true });
await writeFile(join(root, config.output.file), `${JSON.stringify(output, null, 2)}\n`);

console.log(JSON.stringify({
  status,
  score,
  outputFile: config.output.file,
  failedChecks: failed.map((check) => check.id),
  actionItems
}, null, 2));

if (config.output.failStatuses.includes(status)) {
  process.exit(1);
}

function decideStatus(scoreToDecide, bands) {
  const matched = bands
    .filter((band) => scoreToDecide >= band.minInclusive)
    .sort((left, right) => right.minInclusive - left.minInclusive)[0];
  return matched?.status ?? "BLOCK";
}

function getValue(source, path) {
  return path.split(".").reduce((value, key) => {
    if (value && Object.hasOwn(value, key)) return value[key];
    throw new Error(`field is not available: ${path}`);
  }, source);
}

function compare(actual, operator, expected) {
  if (operator === "==") return actual === expected;
  if (operator === "<=") return actual <= expected;
  if (operator === ">=") return actual >= expected;
  throw new Error(`Unsupported operator: ${operator}`);
}

function validateConfig(configToValidate) {
  assert(configToValidate.schemaVersion === "execution-completion-score-config.v1", "config.schemaVersion must be execution-completion-score-config.v1.");
  assert(Array.isArray(configToValidate.items) && configToValidate.items.length > 0, "config.items must be a non-empty array.");
  assert(Array.isArray(configToValidate.statusBands) && configToValidate.statusBands.length > 0, "config.statusBands must be a non-empty array.");
  assert(Array.isArray(configToValidate.actions), "config.actions must be an array.");
  assert(configToValidate.output && typeof configToValidate.output.file === "string", "config.output.file is required.");
  assert(Array.isArray(configToValidate.output.failStatuses), "config.output.failStatuses must be an array.");

  for (const [index, item] of configToValidate.items.entries()) {
    assert(typeof item.id === "string" && item.id, `items[${index}].id is required.`);
    assert(typeof item.field === "string" && item.field, `items[${index}].field is required.`);
    assert(["==", "<=", ">="].includes(item.operator), `items[${index}].operator is invalid.`);
    assert(typeof item.weight === "number" && item.weight > 0, `items[${index}].weight must be positive.`);
    assert(["WATCH", "ACTION", "BLOCK"].includes(item.severity), `items[${index}].severity is invalid.`);
  }
}

function validateRecord(recordToValidate) {
  assert(recordToValidate.schemaVersion === "execution-completion-record.v1", "record.schemaVersion must be execution-completion-record.v1.");
  assert(recordToValidate.task && typeof recordToValidate.task.taskId === "string", "record.task.taskId is required.");
  assert(typeof recordToValidate.task.title === "string" && recordToValidate.task.title, "record.task.title is required.");
}

function assert(value, message) {
  if (!value) {
    throw new Error(message);
  }
}
