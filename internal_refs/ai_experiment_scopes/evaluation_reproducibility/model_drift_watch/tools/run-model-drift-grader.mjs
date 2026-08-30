/*
Purpose:
  Grade a model drift raw run against its case set and write an observation JSON.

Execution prerequisites:
  Run from the repository root with Node.js. The first argument must be a JSON
  config file using schemaVersion "model-drift-grader-config.v1". The raw run
  must use schemaVersion "model-drift-raw-run.v1".

Usage:
  node internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/tools/run-model-drift-grader.mjs <config.json>

Example:
  node internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/tools/run-model-drift-grader.mjs internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/configs/grader-fixture-ok.config.json

Failure check:
  If status is FAIL, open output.graderResultFile and inspect
  caseResults[].violations[].path and caseResults[].violations[].message.
*/

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const configPath = process.argv[2];
const root = process.cwd();

if (!configPath) {
  throw new Error("Usage: node run-model-drift-grader.mjs <config.json>");
}

const config = JSON.parse(await readFile(join(root, configPath), "utf8"));
validateConfig(config);

const caseSet = JSON.parse(await readFile(join(root, config.caseSetFile), "utf8"));
const rawRun = JSON.parse(await readFile(join(root, config.rawRunFile), "utf8"));
validateCaseSet(caseSet);
validateRawRun(rawRun);

const casesById = new Map(caseSet.cases.map((item) => [item.caseId, item]));
const rawCasesById = new Map(rawRun.cases.map((item) => [item.caseId, item]));
const caseResults = [];

for (const caseItem of caseSet.cases) {
  const rawCase = rawCasesById.get(caseItem.caseId);
  if (!rawCase) {
    caseResults.push({
      caseId: caseItem.caseId,
      status: "FAIL",
      contractPassed: false,
      sourceTraceRate: caseItem.grading.sourceTraceRequired ? 0 : 1,
      rubric: gradeRubric(caseItem, null),
      violations: [
        violation("rawRun.cases", `raw output is missing for caseId: ${caseItem.caseId}`, "BLOCK")
      ]
    });
    continue;
  }

  caseResults.push(gradeCase(caseItem, rawCase));
}

for (const rawCase of rawRun.cases) {
  if (!casesById.has(rawCase.caseId)) {
    caseResults.push({
      caseId: rawCase.caseId,
      status: "FAIL",
      contractPassed: false,
      sourceTraceRate: 0,
      rubric: {
        earned: 0,
        total: 0,
        details: []
      },
      violations: [
        violation("caseSet.cases", `raw run contains unknown caseId: ${rawCase.caseId}`, "ACTION")
      ]
    });
  }
}

const metrics = buildMetrics(rawRun, caseResults);
const status = caseResults.some((item) => item.status === "FAIL") ? "FAIL" : "PASS";
const observation = {
  schemaVersion: "model-drift-watch-observation.v1",
  runId: rawRun.runId,
  runAt: rawRun.endedAt,
  watchType: rawRun.watchType,
  model: {
    provider: rawRun.provider,
    name: rawRun.model,
    modelGroup: rawRun.modelGroup ?? null,
    versionHint: "raw run model field",
    settings: rawRun.settings
  },
  caseSetId: rawRun.caseSetId,
  caseSetFile: config.caseSetFile,
  rawRunFile: config.rawRunFile,
  grader: {
    graderId: config.graderId,
    configPath
  },
  metrics
};

const graderResult = {
  schemaVersion: "model-drift-grader-result.v1",
  generatedAt: new Date().toISOString(),
  graderId: config.graderId,
  configPath,
  status,
  caseSetFile: config.caseSetFile,
  rawRunFile: config.rawRunFile,
  observationFile: config.output.observationFile,
  summary: {
    caseCount: caseSet.cases.length,
    failedCaseCount: caseResults.filter((item) => item.status === "FAIL").length,
    contractPassRate: metrics.contractPassRate,
    sourceTraceRate: metrics.sourceTraceRate,
    taskRubricScore: metrics.taskRubricScore
  },
  caseResults
};

await writeJson(config.output.observationFile, observation);
await writeJson(config.output.graderResultFile, graderResult);

console.log(JSON.stringify({
  status,
  observationFile: config.output.observationFile,
  graderResultFile: config.output.graderResultFile,
  failedCaseCount: graderResult.summary.failedCaseCount,
  metrics
}, null, 2));

if (config.output.failStatuses.includes(status)) {
  process.exit(1);
}

function gradeCase(caseItem, rawCase) {
  const violations = [];
  const parsed = parseOutput(rawCase.outputText, caseItem.expectedContract, violations);
  const contractPassed = violations.filter((item) => item.kind === "contract").length === 0;
  const sourceTrace = gradeSourceTrace(parsed.value, caseItem, violations);
  const rubric = gradeRubric(caseItem, rawCase);
  const outputTokenLimitPassed = checkOutputTokenLimit(rawCase, caseItem, violations);
  const refusedOrFallback = isRefusalOrFallback(rawCase);
  if (refusedOrFallback) {
    violations.push(violation("rawCase.status", `case returned ${rawCase.status}`, "ACTION", "refusal_or_fallback"));
  }

  const status = contractPassed && sourceTrace.passed && rubric.passed && outputTokenLimitPassed && !refusedOrFallback ? "PASS" : "FAIL";
  return {
    caseId: caseItem.caseId,
    category: caseItem.category,
    status,
    contractPassed,
    sourceTraceRate: sourceTrace.rate,
    sourceClaims: sourceTrace.totalClaims,
    tracedSourceClaims: sourceTrace.tracedClaims,
    criticalUnsupportedClaims: sourceTrace.criticalUnsupportedClaims,
    rubric,
    usage: rawCase.usage ?? null,
    latencyMs: rawCase.latencyMs ?? null,
    humanRevision: normalizeHumanRevision(rawCase.humanRevision),
    violations
  };
}

function parseOutput(outputText, contract, violations) {
  if (typeof outputText !== "string" || outputText.trim() === "") {
    violations.push(violation("outputText", "outputText must be a non-empty string", "BLOCK", "contract"));
    return { ok: false, value: null };
  }

  const trimmed = outputText.trim();
  if (contract.forbidMarkdown && (trimmed.startsWith("```") || trimmed.includes("\n```"))) {
    violations.push(violation("outputText", "Markdown code fences are forbidden", "ACTION", "contract"));
  }

  let parsed;
  try {
    parsed = JSON.parse(trimmed);
  } catch (error) {
    violations.push(violation("outputText", `outputText is not valid JSON: ${error.message}`, "BLOCK", "contract"));
    return { ok: false, value: null };
  }

  if (!isObject(parsed)) {
    violations.push(violation("outputText", "parsed output must be a JSON object", "BLOCK", "contract"));
    return { ok: false, value: null };
  }

  for (const field of contract.requiredFields) {
    if (!Object.hasOwn(parsed, field)) {
      violations.push(violation(field, "required output field is missing", "BLOCK", "contract"));
    }
  }

  if (contract.allowExtraFields === false) {
    for (const field of Object.keys(parsed)) {
      if (!contract.requiredFields.includes(field)) {
        violations.push(violation(field, "extra output field is not allowed", "ACTION", "contract"));
      }
    }
  }

  if (isObject(contract.fieldTypes)) {
    for (const [field, type] of Object.entries(contract.fieldTypes)) {
      if (Object.hasOwn(parsed, field) && !matchesType(parsed[field], type)) {
        violations.push(violation(field, `expected type ${type}`, "BLOCK", "contract"));
      }
    }
  }

  if (isObject(contract.arrayLimits)) {
    for (const [field, limit] of Object.entries(contract.arrayLimits)) {
      if (Array.isArray(parsed[field]) && parsed[field].length > limit) {
        violations.push(violation(field, `array length must be <= ${limit}`, "ACTION", "contract"));
      }
    }
  }

  if (Number.isInteger(contract.maxWords) && countWords(outputText) > contract.maxWords) {
    violations.push(violation("outputText", `word count must be <= ${contract.maxWords}`, "WATCH", "contract"));
  }

  return { ok: true, value: parsed };
}

function gradeSourceTrace(parsed, caseItem, violations) {
  if (!caseItem.grading.sourceTraceRequired) {
    return {
      passed: true,
      totalClaims: 0,
      tracedClaims: 0,
      criticalUnsupportedClaims: 0,
      rate: 1
    };
  }

  if (!isObject(parsed)) {
    return {
      passed: false,
      totalClaims: 0,
      tracedClaims: 0,
      criticalUnsupportedClaims: 1,
      rate: 0
    };
  }

  const sourceField = caseItem.expectedContract.claimSourceField ?? "sourceIds";
  const allowedSourceIds = caseItem.expectedContract.allowedSourceIds ?? [];
  const claimItems = [];

  for (const field of ["claims", "risks"]) {
    if (Array.isArray(parsed[field])) {
      for (const [index, item] of parsed[field].entries()) {
        claimItems.push({
          path: `${field}[${index}]`,
          value: item
        });
      }
    }
  }

  let tracedClaims = 0;
  let criticalUnsupportedClaims = 0;

  for (const item of claimItems) {
    const sourceIds = isObject(item.value) ? item.value[sourceField] : undefined;
    const valid = Array.isArray(sourceIds) &&
      sourceIds.length > 0 &&
      sourceIds.every((sourceId) => allowedSourceIds.includes(sourceId));

    if (valid) {
      tracedClaims += 1;
    } else {
      criticalUnsupportedClaims += 1;
      violations.push(violation(`${item.path}.${sourceField}`, "claim must include allowed source IDs", "BLOCK", "source_trace"));
    }
  }

  const rate = claimItems.length === 0 ? 0 : tracedClaims / claimItems.length;
  return {
    passed: criticalUnsupportedClaims === 0 && claimItems.length > 0,
    totalClaims: claimItems.length,
    tracedClaims,
    criticalUnsupportedClaims,
    rate
  };
}

function gradeRubric(caseItem, rawCase) {
  const scores = rawCase?.manualRubricScores ?? {};
  const details = caseItem.grading.rubric.map((rubric) => {
    const score = scores[rubric.id];
    const actual = typeof score === "number" ? score : 0;
    return {
      id: rubric.id,
      score: actual,
      maxScore: rubric.maxScore,
      passScore: rubric.passScore,
      passed: actual >= rubric.passScore,
      criteria: rubric.criteria
    };
  });
  const earned = details.reduce((sum, item) => sum + item.score, 0);
  const total = details.reduce((sum, item) => sum + item.maxScore, 0);
  return {
    earned,
    total,
    passed: details.every((item) => item.passed),
    scoreRate: total === 0 ? 0 : earned / total,
    details
  };
}

function checkOutputTokenLimit(rawCase, caseItem, violations) {
  const outputTokens = rawCase.usage?.outputTokens;
  if (typeof outputTokens !== "number") return true;
  if (outputTokens <= caseItem.grading.maxOutputTokens) return true;
  violations.push(violation("usage.outputTokens", `outputTokens must be <= ${caseItem.grading.maxOutputTokens}`, "WATCH", "contract"));
  return false;
}

function buildMetrics(rawRun, caseResults) {
  const expectedCaseResults = caseResults.filter((item) => item.rubric.total > 0);
  const contractPassRate = ratio(caseResults.filter((item) => item.contractPassed).length, caseResults.length);
  const sourceRequiredResults = caseResults.filter((item) => item.sourceClaims > 0);
  const totalSourceClaims = sourceRequiredResults.reduce((sum, item) => sum + item.sourceClaims, 0);
  const tracedSourceClaims = sourceRequiredResults.reduce((sum, item) => sum + item.tracedSourceClaims, 0);
  const rubricEarned = expectedCaseResults.reduce((sum, item) => sum + item.rubric.earned, 0);
  const rubricTotal = expectedCaseResults.reduce((sum, item) => sum + item.rubric.total, 0);
  const totalTokens = rawRun.cases.reduce((sum, item) => sum + (typeof item.usage?.totalTokens === "number" ? item.usage.totalTokens : 0), 0);
  const refusalOrFallbackRate = ratio(rawRun.cases.filter(isRefusalOrFallback).length, rawRun.cases.length);
  const revisions = rawRun.cases.map((item) => normalizeHumanRevision(item.humanRevision));
  const humanRevisionMeasured = revisions.every((item) => item.measured);
  const humanRevisionMinutes = humanRevisionMeasured ? revisions.reduce((sum, item) => sum + item.minutes, 0) : null;

  return {
    contractPassRate,
    sourceTraceRate: totalSourceClaims === 0 ? 1 : tracedSourceClaims / totalSourceClaims,
    taskRubricScore: rubricTotal === 0 ? 0 : Math.round((rubricEarned / rubricTotal) * 100),
    criticalUnsupportedClaims: caseResults.reduce((sum, item) => sum + item.criticalUnsupportedClaims, 0),
    totalTokens,
    latencyMs: rawRun.latencyMs,
    refusalOrFallbackRate,
    humanRevisionMeasured,
    humanRevisionMinutes,
    conclusionConflictCount: rawRun.conclusionConflictCount ?? 0
  };
}

function normalizeHumanRevision(value) {
  if (!isObject(value)) {
    return {
      measured: false,
      minutes: null
    };
  }
  return {
    measured: value.measured === true,
    minutes: value.measured === true && typeof value.minutes === "number" ? value.minutes : null
  };
}

function matchesType(value, type) {
  if (type === "string") return typeof value === "string";
  if (type === "array<string>") return Array.isArray(value) && value.every((item) => typeof item === "string");
  if (type === "array<object>") return Array.isArray(value) && value.every(isObject);
  if (type.startsWith("enum<") && type.endsWith(">")) {
    const values = type.slice("enum<".length, -1).split("|");
    return values.includes(value);
  }
  return false;
}

function countWords(value) {
  const normalized = value.replace(/[{}[\]":,]/g, " ").trim();
  if (!normalized) return 0;
  return normalized.split(/\s+/).length;
}

function isRefusalOrFallback(rawCase) {
  return ["REFUSAL", "FALLBACK"].includes(rawCase.status) ||
    ["refusal", "fallback"].includes(rawCase.stopReason);
}

function ratio(numerator, denominator) {
  return denominator === 0 ? 0 : numerator / denominator;
}

async function writeJson(path, value) {
  await mkdir(dirname(join(root, path)), { recursive: true });
  await writeFile(join(root, path), `${JSON.stringify(value, null, 2)}\n`);
}

function validateConfig(value) {
  assertObject(value, "config");
  assert(value.schemaVersion === "model-drift-grader-config.v1", "config.schemaVersion must be model-drift-grader-config.v1.");
  assertNonEmptyString(value.graderId, "config.graderId");
  assertNonEmptyString(value.caseSetFile, "config.caseSetFile");
  assertNonEmptyString(value.rawRunFile, "config.rawRunFile");
  assertObject(value.output, "config.output");
  assertNonEmptyString(value.output.observationFile, "config.output.observationFile");
  assertNonEmptyString(value.output.graderResultFile, "config.output.graderResultFile");
  assert(Array.isArray(value.output.failStatuses), "config.output.failStatuses must be an array.");
}

function validateCaseSet(value) {
  assertObject(value, "caseSet");
  assert(value.schemaVersion === "model-drift-case-set.v1", "caseSet.schemaVersion must be model-drift-case-set.v1.");
  assert(Array.isArray(value.cases) && value.cases.length > 0, "caseSet.cases must be a non-empty array.");
}

function validateRawRun(value) {
  assertObject(value, "rawRun");
  assert(value.schemaVersion === "model-drift-raw-run.v1", "rawRun.schemaVersion must be model-drift-raw-run.v1.");
  assertNonEmptyString(value.runId, "rawRun.runId");
  assertNonEmptyString(value.provider, "rawRun.provider");
  assertNonEmptyString(value.model, "rawRun.model");
  assertNonEmptyString(value.watchType, "rawRun.watchType");
  assert(Array.isArray(value.cases), "rawRun.cases must be an array.");
}

function assertObject(value, path) {
  assert(isObject(value), `${path} must be an object.`);
}

function assertNonEmptyString(value, path) {
  assert(typeof value === "string" && value.trim() !== "", `${path} must be a non-empty string.`);
}

function isObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function violation(path, message, severity, kind = "contract") {
  return {
    kind,
    path,
    severity,
    message
  };
}

function assert(value, message) {
  if (!value) throw new Error(message);
}
