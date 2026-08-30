/*
Purpose:
  Validate a model drift case set before it is used by model adapters or graders.

Execution prerequisites:
  Run from the repository root with Node.js. The first argument must be a JSON
  config file using schemaVersion "model-drift-case-schema-check-config.v1".

Usage:
  node internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/tools/check-model-drift-cases.mjs <config.json>

Example:
  node internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/tools/check-model-drift-cases.mjs internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/configs/case-schema-check.config.json

Failure check:
  If status is FAIL, open result.failedChecks[].path and result.failedChecks[].message.
*/

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const configPath = process.argv[2];
const root = process.cwd();

if (!configPath) {
  throw new Error("Usage: node check-model-drift-cases.mjs <config.json>");
}

const config = JSON.parse(await readFile(join(root, configPath), "utf8"));
validateConfig(config);

const caseSet = JSON.parse(await readFile(join(root, config.targetFile), "utf8"));
const failedChecks = validateCaseSet(caseSet, config.expected);
const status = failedChecks.length === 0 ? "PASS" : "FAIL";

const result = {
  schemaVersion: "model-drift-case-schema-check-result.v1",
  generatedAt: new Date().toISOString(),
  configPath,
  targetFile: config.targetFile,
  status,
  summary: {
    caseSetId: caseSet.caseSetId ?? null,
    caseCount: Array.isArray(caseSet.cases) ? caseSet.cases.length : 0,
    checkedCaseIds: Array.isArray(caseSet.cases) ? caseSet.cases.map((item) => item.caseId ?? null) : []
  },
  passedChecks: buildPassedChecks(caseSet, config.expected, failedChecks),
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
  assert(value.schemaVersion === "model-drift-case-schema-check-config.v1", "config.schemaVersion must be model-drift-case-schema-check-config.v1.");
  assertNonEmptyString(value.checkId, "config.checkId");
  assertNonEmptyString(value.targetFile, "config.targetFile");
  assertObject(value.expected, "config.expected");
  assertObject(value.output, "config.output");
  assertNonEmptyString(value.output.file, "config.output.file");
  assertArray(value.output.failStatuses, "config.output.failStatuses");

  assertNonEmptyString(value.expected.caseSetSchemaVersion, "expected.caseSetSchemaVersion");
  assertNonEmptyString(value.expected.caseSetId, "expected.caseSetId");
  assertPositiveInteger(value.expected.caseCount, "expected.caseCount");
  for (const field of [
    "requiredCaseIds",
    "allowedCategories",
    "requiredTopLevelFields",
    "requiredCaseFields",
    "requiredExpectedContractFields",
    "requiredGradingFields",
    "requiredRubricFields"
  ]) {
    assertNonEmptyStringArray(value.expected[field], `expected.${field}`);
  }
}

function validateCaseSet(caseSet, expected) {
  const failures = [];
  checkObject(caseSet, "caseSet", failures);

  if (!isObject(caseSet)) return failures;

  for (const field of expected.requiredTopLevelFields) {
    if (!Object.hasOwn(caseSet, field)) {
      failures.push(fail(`caseSet.${field}`, "required top-level field is missing"));
    }
  }

  checkEqual(caseSet.schemaVersion, expected.caseSetSchemaVersion, "caseSet.schemaVersion", failures);
  checkEqual(caseSet.caseSetId, expected.caseSetId, "caseSet.caseSetId", failures);
  checkArray(caseSet.cases, "caseSet.cases", failures);

  if (!Array.isArray(caseSet.cases)) return failures;

  checkEqual(caseSet.cases.length, expected.caseCount, "caseSet.cases.length", failures);

  const caseIds = caseSet.cases.map((item) => item.caseId);
  const seenIds = new Set();
  for (const [index, caseId] of caseIds.entries()) {
    if (seenIds.has(caseId)) {
      failures.push(fail(`caseSet.cases[${index}].caseId`, `duplicate caseId: ${caseId}`));
    }
    seenIds.add(caseId);
  }

  for (const requiredCaseId of expected.requiredCaseIds) {
    if (!seenIds.has(requiredCaseId)) {
      failures.push(fail("caseSet.cases", `required caseId is missing: ${requiredCaseId}`));
    }
  }

  caseSet.cases.forEach((item, index) => validateCase(item, index, expected, failures));
  return failures;
}

function validateCase(item, index, expected, failures) {
  const base = `caseSet.cases[${index}]`;
  checkObject(item, base, failures);
  if (!isObject(item)) return;

  for (const field of expected.requiredCaseFields) {
    if (!Object.hasOwn(item, field)) {
      failures.push(fail(`${base}.${field}`, "required case field is missing"));
    }
  }

  checkNonEmptyString(item.caseId, `${base}.caseId`, failures);
  checkIn(item.category, expected.allowedCategories, `${base}.category`, failures);
  checkNonEmptyString(item.watchPurpose, `${base}.watchPurpose`, failures);
  checkNonEmptyString(item.prompt, `${base}.prompt`, failures);
  checkObject(item.expectedContract, `${base}.expectedContract`, failures);
  checkObject(item.grading, `${base}.grading`, failures);

  if (isObject(item.expectedContract)) validateExpectedContract(item.expectedContract, `${base}.expectedContract`, expected, failures);
  if (isObject(item.grading)) validateGrading(item.grading, `${base}.grading`, expected, failures);
}

function validateExpectedContract(contract, path, expected, failures) {
  for (const field of expected.requiredExpectedContractFields) {
    if (!Object.hasOwn(contract, field)) {
      failures.push(fail(`${path}.${field}`, "required expectedContract field is missing"));
    }
  }
  checkEqual(contract.format, "json", `${path}.format`, failures);
  checkNonEmptyStringArray(contract.requiredFields, `${path}.requiredFields`, failures);
  checkObject(contract.fieldTypes, `${path}.fieldTypes`, failures);
  checkBoolean(contract.allowExtraFields, `${path}.allowExtraFields`, failures);
  checkBoolean(contract.forbidMarkdown, `${path}.forbidMarkdown`, failures);

  if (Array.isArray(contract.requiredFields) && isObject(contract.fieldTypes)) {
    for (const field of contract.requiredFields) {
      if (!Object.hasOwn(contract.fieldTypes, field)) {
        failures.push(fail(`${path}.fieldTypes.${field}`, "required output field is missing from fieldTypes"));
      }
    }
  }
}

function validateGrading(grading, path, expected, failures) {
  for (const field of expected.requiredGradingFields) {
    if (!Object.hasOwn(grading, field)) {
      failures.push(fail(`${path}.${field}`, "required grading field is missing"));
    }
  }
  checkBoolean(grading.contractRequired, `${path}.contractRequired`, failures);
  checkBoolean(grading.sourceTraceRequired, `${path}.sourceTraceRequired`, failures);
  checkPositiveInteger(grading.maxOutputTokens, `${path}.maxOutputTokens`, failures);
  checkArray(grading.rubric, `${path}.rubric`, failures);

  if (Array.isArray(grading.rubric)) {
    grading.rubric.forEach((rubric, index) => {
      const rubricPath = `${path}.rubric[${index}]`;
      checkObject(rubric, rubricPath, failures);
      if (!isObject(rubric)) return;
      for (const field of expected.requiredRubricFields) {
        if (!Object.hasOwn(rubric, field)) {
          failures.push(fail(`${rubricPath}.${field}`, "required rubric field is missing"));
        }
      }
      checkNonEmptyString(rubric.id, `${rubricPath}.id`, failures);
      checkPositiveInteger(rubric.maxScore, `${rubricPath}.maxScore`, failures);
      checkPositiveInteger(rubric.passScore, `${rubricPath}.passScore`, failures);
      if (typeof rubric.maxScore === "number" && typeof rubric.passScore === "number" && rubric.passScore > rubric.maxScore) {
        failures.push(fail(`${rubricPath}.passScore`, "passScore must be less than or equal to maxScore"));
      }
      checkNonEmptyString(rubric.criteria, `${rubricPath}.criteria`, failures);
    });
  }
}

function buildPassedChecks(caseSet, expected, failedChecks) {
  const failedIds = new Set(failedChecks.map((item) => item.id));
  const candidates = [
    {
      id: "case_set.schema_version",
      passed: caseSet.schemaVersion === expected.caseSetSchemaVersion
    },
    {
      id: "case_set.case_set_id",
      passed: caseSet.caseSetId === expected.caseSetId
    },
    {
      id: "case_set.case_count",
      passed: Array.isArray(caseSet.cases) && caseSet.cases.length === expected.caseCount
    },
    {
      id: "case_set.required_case_ids",
      passed: Array.isArray(caseSet.cases) && expected.requiredCaseIds.every((caseId) => caseSet.cases.some((item) => item.caseId === caseId))
    },
    {
      id: "case_set.case_contracts",
      passed: Array.isArray(caseSet.cases) && caseSet.cases.every((item) => isObject(item.expectedContract) && isObject(item.grading))
    }
  ];
  return candidates.filter((item) => item.passed && !failedIds.has(item.id));
}

function checkObject(value, path, failures) {
  if (!isObject(value)) failures.push(fail(path, "must be an object"));
}

function checkArray(value, path, failures) {
  if (!Array.isArray(value)) failures.push(fail(path, "must be an array"));
}

function checkEqual(actual, expected, path, failures) {
  if (actual !== expected) failures.push(fail(path, `expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`));
}

function checkIn(actual, allowed, path, failures) {
  if (!allowed.includes(actual)) failures.push(fail(path, `expected one of ${allowed.join(", ")}, got ${JSON.stringify(actual)}`));
}

function checkNonEmptyString(value, path, failures) {
  if (typeof value !== "string" || value.trim() === "") failures.push(fail(path, "must be a non-empty string"));
}

function checkNonEmptyStringArray(value, path, failures) {
  if (!Array.isArray(value) || value.length === 0 || value.some((item) => typeof item !== "string" || item.trim() === "")) {
    failures.push(fail(path, "must be a non-empty string array"));
  }
}

function checkBoolean(value, path, failures) {
  if (typeof value !== "boolean") failures.push(fail(path, "must be a boolean"));
}

function checkPositiveInteger(value, path, failures) {
  if (!Number.isInteger(value) || value <= 0) failures.push(fail(path, "must be a positive integer"));
}

function assertObject(value, path) {
  assert(isObject(value), `${path} must be an object.`);
}

function assertNonEmptyString(value, path) {
  assert(typeof value === "string" && value.trim() !== "", `${path} must be a non-empty string.`);
}

function assertNonEmptyStringArray(value, path) {
  assert(Array.isArray(value) && value.length > 0, `${path} must be a non-empty string array.`);
  for (const item of value) {
    assert(typeof item === "string" && item.trim() !== "", `${path} must contain only non-empty strings.`);
  }
}

function assertPositiveInteger(value, path) {
  assert(Number.isInteger(value) && value > 0, `${path} must be a positive integer.`);
}

function assertArray(value, path) {
  assert(Array.isArray(value), `${path} must be an array.`);
}

function isObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function fail(path, message) {
  return {
    id: path.replaceAll("[", ".").replaceAll("]", "").replaceAll("..", "."),
    path,
    message
  };
}

function assert(value, message) {
  if (!value) throw new Error(message);
}
