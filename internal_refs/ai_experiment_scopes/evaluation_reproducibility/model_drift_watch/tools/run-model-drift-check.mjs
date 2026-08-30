/*
Purpose:
  Compare a baseline model drift observation with a current observation and
  write a drift check result JSON.

Execution prerequisites:
  Run from the repository root with Node.js. The first argument must be a JSON
  config file using schemaVersion "model-drift-check-config.v1". The baseline
  and current inputs must use schemaVersion "model-drift-watch-observation.v1".

Usage:
  node internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/tools/run-model-drift-check.mjs <config.json>

Example:
  node internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/tools/run-model-drift-check.mjs internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/configs/status-fixture-watch.config.json

Failure check:
  If status is WATCH, ACTION, or BLOCK, open the output file and inspect
  checks[] where passed is false. Those checks explain which metric crossed
  which threshold.
*/

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const configPath = process.argv[2];
const root = process.cwd();

if (!configPath) {
  throw new Error("Usage: node run-model-drift-check.mjs <config.json>");
}

const config = JSON.parse(await readFile(join(root, configPath), "utf8"));
validateConfig(config);

const baseline = JSON.parse(await readFile(join(root, config.inputs.baselineFile), "utf8"));
const current = JSON.parse(await readFile(join(root, config.inputs.currentFile), "utf8"));

validateResult("baseline", baseline);
validateResult("current", current);

const metrics = buildComparisonMetrics(baseline.metrics, current.metrics);
const checks = config.thresholds.map((threshold) => {
  const actual = metrics[threshold.metric];
  assert(typeof actual === "number" && Number.isFinite(actual), `metric is not available: ${threshold.metric}`);
  const passed = compare(actual, threshold.operator, threshold.value);
  return {
    id: threshold.id,
    metric: threshold.metric,
    actual,
    operator: threshold.operator,
    expected: threshold.value,
    unit: threshold.unit,
    severity: threshold.severity,
    passed,
    message: threshold.message
  };
});

const status = decideStatus(checks);
const actionItems = config.actions
  .filter((action) => action.status === status)
  .flatMap((action) => action.items);

const output = {
  schemaVersion: "model-drift-check-result.v1",
  generatedAt: new Date().toISOString(),
  configPath,
  inputs: config.inputs,
  model: current.model,
  baselineRunId: baseline.runId,
  currentRunId: current.runId,
  status,
  metrics,
  checks,
  actionItems
};

await mkdir(dirname(join(root, config.output.file)), { recursive: true });
await writeFile(join(root, config.output.file), `${JSON.stringify(output, null, 2)}\n`);

console.log(JSON.stringify({
  status,
  outputFile: config.output.file,
  failedChecks: checks.filter((check) => !check.passed).map((check) => check.id),
  actionItems
}, null, 2));

if (config.output.failStatuses.includes(status)) {
  process.exit(1);
}

function buildComparisonMetrics(base, now) {
  return {
    contractPassRateDrop: base.contractPassRate - now.contractPassRate,
    sourceTraceRateDrop: base.sourceTraceRate - now.sourceTraceRate,
    taskScoreDrop: base.taskRubricScore - now.taskRubricScore,
    tokenIncreaseRate: rateIncrease(base.totalTokens, now.totalTokens),
    latencyIncreaseRate: rateIncrease(base.latencyMs, now.latencyMs),
    falseRefusalOrFallbackRate: now.refusalOrFallbackRate,
    humanRevisionMinutesIncreaseRate: rateIncrease(base.humanRevisionMinutes, now.humanRevisionMinutes),
    criticalUnsupportedClaims: now.criticalUnsupportedClaims,
    conclusionConflictCount: now.conclusionConflictCount
  };
}

function rateIncrease(baseValue, currentValue) {
  if (baseValue === 0) {
    return currentValue === 0 ? 0 : 1;
  }
  return (currentValue - baseValue) / baseValue;
}

function decideStatus(checksToDecide) {
  const failed = checksToDecide.filter((check) => !check.passed);
  if (failed.length === 0) return "OK";

  const order = new Map([
    ["OK", 0],
    ["WATCH", 1],
    ["ACTION", 2],
    ["BLOCK", 3]
  ]);
  return failed.reduce((status, check) => {
    return order.get(check.severity) > order.get(status) ? check.severity : status;
  }, "WATCH");
}

function compare(actual, operator, expected) {
  if (operator === "<=") return actual <= expected;
  if (operator === ">=") return actual >= expected;
  if (operator === "==") return actual === expected;
  throw new Error(`Unsupported operator: ${operator}`);
}

function validateConfig(configToValidate) {
  assert(configToValidate.schemaVersion === "model-drift-check-config.v1", "config.schemaVersion must be model-drift-check-config.v1.");
  assert(configToValidate.inputs && typeof configToValidate.inputs === "object", "config.inputs is required.");
  assert(typeof configToValidate.inputs.baselineFile === "string" && configToValidate.inputs.baselineFile, "inputs.baselineFile is required.");
  assert(typeof configToValidate.inputs.currentFile === "string" && configToValidate.inputs.currentFile, "inputs.currentFile is required.");
  assert(Array.isArray(configToValidate.thresholds) && configToValidate.thresholds.length > 0, "config.thresholds must be a non-empty array.");
  assert(configToValidate.output && typeof configToValidate.output === "object", "config.output is required.");
  assert(typeof configToValidate.output.file === "string" && configToValidate.output.file, "output.file is required.");
  assert(Array.isArray(configToValidate.output.failStatuses), "output.failStatuses must be an array.");
  assert(Array.isArray(configToValidate.actions), "config.actions must be an array.");

  for (const [index, threshold] of configToValidate.thresholds.entries()) {
    assert(typeof threshold.id === "string" && threshold.id, `thresholds[${index}].id is required.`);
    assert(typeof threshold.metric === "string" && threshold.metric, `thresholds[${index}].metric is required.`);
    assert(["<=", ">=", "=="].includes(threshold.operator), `thresholds[${index}].operator is invalid.`);
    assert(typeof threshold.value === "number" && Number.isFinite(threshold.value), `thresholds[${index}].value must be a number.`);
    assert(["WATCH", "ACTION", "BLOCK"].includes(threshold.severity), `thresholds[${index}].severity is invalid.`);
  }
}

function validateResult(label, result) {
  assert(result && typeof result === "object" && !Array.isArray(result), `${label}: result must be an object.`);
  assert(result.schemaVersion === "model-drift-watch-observation.v1", `${label}: schemaVersion must be model-drift-watch-observation.v1.`);
  assert(typeof result.runId === "string" && result.runId, `${label}: runId is required.`);
  assert(result.model && typeof result.model === "object", `${label}: model is required.`);
  assert(result.metrics && typeof result.metrics === "object", `${label}: metrics is required.`);

  for (const key of [
    "contractPassRate",
    "sourceTraceRate",
    "taskRubricScore",
    "criticalUnsupportedClaims",
    "totalTokens",
    "latencyMs",
    "refusalOrFallbackRate",
    "humanRevisionMinutes",
    "conclusionConflictCount"
  ]) {
    assert(typeof result.metrics[key] === "number" && Number.isFinite(result.metrics[key]), `${label}: metrics.${key} must be a number.`);
  }
}

function assert(value, message) {
  if (!value) {
    throw new Error(message);
  }
}
