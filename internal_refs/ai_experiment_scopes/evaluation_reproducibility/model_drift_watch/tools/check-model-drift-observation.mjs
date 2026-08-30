/*
Purpose:
  Validate one model drift observation JSON before it is used by the drift
  comparison runner.

Execution prerequisites:
  Run from the repository root with Node.js. The first argument must be a JSON
  config file using schemaVersion
  "model-drift-observation-schema-check-config.v1". The target observation
  must use schemaVersion "model-drift-watch-observation.v1".

Usage:
  node internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/tools/check-model-drift-observation.mjs <config.json>

Example:
  node internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/tools/check-model-drift-observation.mjs internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/configs/observation-schema-check.config.json

Failure check:
  If status is FAIL, open result.failedChecks[].path and
  result.failedChecks[].message. The failed path identifies the missing or
  invalid observation field.
*/

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const configPath = process.argv[2];
const root = process.cwd();

if (!configPath) {
  throw new Error("Usage: node check-model-drift-observation.mjs <config.json>");
}

const config = JSON.parse(await readFile(join(root, configPath), "utf8"));
validateConfig(config);

const observation = JSON.parse(await readFile(join(root, config.targetFile), "utf8"));
const failedChecks = validateObservation(observation, config.expected);
const status = failedChecks.length === 0 ? "PASS" : "FAIL";

const result = {
  schemaVersion: "model-drift-observation-schema-check-result.v1",
  generatedAt: new Date().toISOString(),
  configPath,
  targetFile: config.targetFile,
  status,
  summary: {
    runId: observation.runId ?? null,
    provider: observation.model?.provider ?? null,
    model: observation.model?.name ?? null,
    checkedMetricCount: config.expected.numericMetrics.length + config.expected.booleanMetrics.length,
    failedCheckCount: failedChecks.length
  },
  passedChecks: buildPassedChecks(observation, config.expected, failedChecks),
  failedChecks
};

await mkdir(dirname(join(root, config.output.file)), { recursive: true });
await writeFile(join(root, config.output.file), `${JSON.stringify(result, null, 2)}\n`);

console.log(JSON.stringify({
  status,
  outputFile: config.output.file,
  failedCheckCount: failedChecks.length
}, null, 2));

if (config.output.failStatuses.includes(status)) {
  process.exit(1);
}

function validateConfig(value) {
  assertObject(value, "config");
  assert(value.schemaVersion === "model-drift-observation-schema-check-config.v1", "config.schemaVersion must be model-drift-observation-schema-check-config.v1.");
  assertNonEmptyString(value.checkId, "config.checkId");
  assertNonEmptyString(value.targetFile, "config.targetFile");
  assertObject(value.expected, "config.expected");
  assertNonEmptyString(value.expected.observationSchemaVersion, "expected.observationSchemaVersion");
  for (const field of [
    "requiredTopLevelFields",
    "requiredModelFields",
    "requiredGraderFields",
    "numericMetrics",
    "booleanMetrics",
    "rateMetrics",
    "integerMetrics"
  ]) {
    assertNonEmptyStringArray(value.expected[field], `expected.${field}`);
  }
  assertObject(value.output, "config.output");
  assertNonEmptyString(value.output.file, "config.output.file");
  assert(Array.isArray(value.output.failStatuses), "config.output.failStatuses must be an array.");
}

function validateObservation(observation, expected) {
  const failures = [];
  checkObject(observation, "observation", failures);
  if (!isObject(observation)) return failures;

  for (const field of expected.requiredTopLevelFields) {
    if (!Object.hasOwn(observation, field)) {
      failures.push(fail(`observation.${field}`, "required top-level field is missing"));
    }
  }

  checkEqual(observation.schemaVersion, expected.observationSchemaVersion, "observation.schemaVersion", failures);
  checkNonEmptyString(observation.runId, "observation.runId", failures);
  checkNonEmptyString(observation.runAt, "observation.runAt", failures);
  checkNonEmptyString(observation.watchType, "observation.watchType", failures);
  checkNonEmptyString(observation.caseSetId, "observation.caseSetId", failures);
  checkNonEmptyString(observation.caseSetFile, "observation.caseSetFile", failures);
  checkNonEmptyString(observation.rawRunFile, "observation.rawRunFile", failures);
  checkObject(observation.model, "observation.model", failures);
  checkObject(observation.grader, "observation.grader", failures);
  checkObject(observation.metrics, "observation.metrics", failures);

  if (isObject(observation.model)) {
    for (const field of expected.requiredModelFields) {
      if (!Object.hasOwn(observation.model, field)) {
        failures.push(fail(`observation.model.${field}`, "required model field is missing"));
      }
    }
    checkNonEmptyString(observation.model.provider, "observation.model.provider", failures);
    checkNonEmptyString(observation.model.name, "observation.model.name", failures);
    checkObject(observation.model.settings, "observation.model.settings", failures);
  }

  if (isObject(observation.grader)) {
    for (const field of expected.requiredGraderFields) {
      if (!Object.hasOwn(observation.grader, field)) {
        failures.push(fail(`observation.grader.${field}`, "required grader field is missing"));
      }
    }
    checkNonEmptyString(observation.grader.graderId, "observation.grader.graderId", failures);
    checkNonEmptyString(observation.grader.configPath, "observation.grader.configPath", failures);
  }

  if (isObject(observation.metrics)) {
    validateMetrics(observation.metrics, expected, failures);
  }

  return failures;
}

function validateMetrics(metrics, expected, failures) {
  for (const metric of expected.numericMetrics) {
    if (typeof metrics[metric] !== "number" || !Number.isFinite(metrics[metric])) {
      failures.push(fail(`observation.metrics.${metric}`, "metric must be a finite number"));
    }
  }

  for (const metric of expected.booleanMetrics) {
    if (typeof metrics[metric] !== "boolean") {
      failures.push(fail(`observation.metrics.${metric}`, "metric must be a boolean"));
    }
  }

  for (const metric of expected.rateMetrics) {
    if (typeof metrics[metric] === "number" && (metrics[metric] < 0 || metrics[metric] > 1)) {
      failures.push(fail(`observation.metrics.${metric}`, "rate metric must be between 0 and 1"));
    }
  }

  for (const metric of expected.integerMetrics) {
    if (typeof metrics[metric] === "number" && !Number.isInteger(metrics[metric])) {
      failures.push(fail(`observation.metrics.${metric}`, "metric must be an integer"));
    }
  }
}

function buildPassedChecks(observation, expected, failedChecks) {
  const failedPaths = new Set(failedChecks.map((item) => item.path));
  const candidates = [
    {
      id: "observation.schema_version",
      path: "observation.schemaVersion",
      passed: observation.schemaVersion === expected.observationSchemaVersion
    },
    {
      id: "observation.required_top_level_fields",
      path: "observation",
      passed: expected.requiredTopLevelFields.every((field) => Object.hasOwn(observation, field))
    },
    {
      id: "observation.model_fields",
      path: "observation.model",
      passed: isObject(observation.model) && expected.requiredModelFields.every((field) => Object.hasOwn(observation.model, field))
    },
    {
      id: "observation.grader_fields",
      path: "observation.grader",
      passed: isObject(observation.grader) && expected.requiredGraderFields.every((field) => Object.hasOwn(observation.grader, field))
    },
    {
      id: "observation.metrics",
      path: "observation.metrics",
      passed: isObject(observation.metrics) && expected.numericMetrics.every((metric) => typeof observation.metrics[metric] === "number")
    }
  ];
  return candidates.filter((item) => item.passed && !failedPaths.has(item.path));
}

function checkObject(value, path, failures) {
  if (!isObject(value)) failures.push(fail(path, "must be an object"));
}

function checkEqual(actual, expected, path, failures) {
  if (actual !== expected) failures.push(fail(path, `expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`));
}

function checkNonEmptyString(value, path, failures) {
  if (typeof value !== "string" || value.trim() === "") failures.push(fail(path, "must be a non-empty string"));
}

function assertObject(value, path) {
  assert(isObject(value), `${path} must be an object.`);
}

function assertNonEmptyString(value, path) {
  assert(typeof value === "string" && value.trim() !== "", `${path} must be a non-empty string.`);
}

function assertNonEmptyStringArray(value, path) {
  assert(Array.isArray(value) && value.length > 0, `${path} must be a non-empty array.`);
  value.forEach((item, index) => assertNonEmptyString(item, `${path}[${index}]`));
}

function isObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function fail(path, message) {
  return { path, message };
}

function assert(value, message) {
  if (!value) throw new Error(message);
}
