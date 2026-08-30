/*
Purpose:
  Generate an action proposal JSON from a model drift check result.

Execution prerequisites:
  Run from the repository root with Node.js. The first argument must be a JSON
  config file using schemaVersion "model-drift-proposal-generator-config.v1".
  The source check result must use schemaVersion "model-drift-check-result.v1".

Usage:
  node internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/tools/run-model-drift-proposal-generator.mjs <config.json>

Example:
  node internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/tools/run-model-drift-proposal-generator.mjs internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/configs/proposal-action.config.json

Failure check:
  If status is FAIL, open the generated proposal JSON and inspect
  validationErrors[].path and validationErrors[].message. Missing rules mean a
  failed drift check could not be mapped to prompt/schema/routing/threshold.
*/

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const configPath = process.argv[2];
const root = process.cwd();

if (!configPath) {
  throw new Error("Usage: node run-model-drift-proposal-generator.mjs <config.json>");
}

const config = JSON.parse(await readFile(join(root, configPath), "utf8"));
validateConfig(config);

const checkResult = JSON.parse(await readFile(join(root, config.source.checkResultFile), "utf8"));
validateCheckResult(checkResult);

const ruleByCheckId = new Map(config.rules.map((rule) => [rule.checkId, rule]));
const failedChecks = checkResult.checks.filter((check) => !check.passed);
const validationErrors = [];

if (!config.allowedSourceStatuses.includes(checkResult.status)) {
  validationErrors.push(error("checkResult.status", `status must be one of ${config.allowedSourceStatuses.join(", ")}`));
}

const proposals = failedChecks.map((check, index) => {
  const rule = ruleByCheckId.get(check.id);
  if (!rule) {
    validationErrors.push(error(`failedChecks[${index}].id`, `proposal rule is missing for checkId: ${check.id}`));
    return null;
  }
  return {
    target: rule.target,
    reason: rule.reason,
    changeSummary: rule.changeSummary,
    requiresHumanApproval: rule.requiresHumanApproval,
    evidence: {
      checkId: check.id,
      metric: check.metric,
      actual: check.actual,
      operator: check.operator,
      expected: check.expected,
      severity: check.severity,
      message: check.message
    }
  };
}).filter(Boolean);

const status = validationErrors.length === 0 ? "PASS" : "FAIL";
const proposal = {
  schemaVersion: "model-drift-action-proposal.v1",
  generatedAt: new Date().toISOString(),
  proposalId: config.proposalId,
  sourceCheckResult: config.source.checkResultFile,
  status: checkResult.status,
  baselineRunId: checkResult.baselineRunId,
  currentRunId: checkResult.currentRunId,
  model: checkResult.model,
  proposals,
  validation: {
    status,
    failedCheckCount: failedChecks.length,
    proposalCount: proposals.length,
    validationErrors
  }
};

await mkdir(dirname(join(root, config.output.proposalFile)), { recursive: true });
await writeFile(join(root, config.output.proposalFile), `${JSON.stringify(proposal, null, 2)}\n`);

console.log(JSON.stringify({
  status,
  proposalFile: config.output.proposalFile,
  sourceStatus: checkResult.status,
  failedCheckCount: failedChecks.length,
  proposalCount: proposals.length,
  validationErrorCount: validationErrors.length
}, null, 2));

if (config.output.failStatuses.includes(status)) {
  process.exit(1);
}

function validateConfig(value) {
  assertObject(value, "config");
  assert(value.schemaVersion === "model-drift-proposal-generator-config.v1", "config.schemaVersion must be model-drift-proposal-generator-config.v1.");
  assertNonEmptyString(value.proposalId, "config.proposalId");
  assertObject(value.source, "config.source");
  assertNonEmptyString(value.source.checkResultFile, "config.source.checkResultFile");
  assertNonEmptyStringArray(value.allowedSourceStatuses, "config.allowedSourceStatuses");
  assert(Array.isArray(value.rules) && value.rules.length > 0, "config.rules must be a non-empty array.");
  assertObject(value.output, "config.output");
  assertNonEmptyString(value.output.proposalFile, "config.output.proposalFile");
  assert(Array.isArray(value.output.failStatuses), "config.output.failStatuses must be an array.");

  for (const [index, rule] of value.rules.entries()) {
    const path = `config.rules[${index}]`;
    assertObject(rule, path);
    assertNonEmptyString(rule.checkId, `${path}.checkId`);
    assert(["prompt", "schema", "routing", "threshold"].includes(rule.target), `${path}.target must be prompt, schema, routing, or threshold.`);
    assertNonEmptyString(rule.reason, `${path}.reason`);
    assertNonEmptyString(rule.changeSummary, `${path}.changeSummary`);
    assert(typeof rule.requiresHumanApproval === "boolean", `${path}.requiresHumanApproval must be a boolean.`);
  }
}

function validateCheckResult(value) {
  assertObject(value, "checkResult");
  assert(value.schemaVersion === "model-drift-check-result.v1", "checkResult.schemaVersion must be model-drift-check-result.v1.");
  assert(["OK", "WATCH", "ACTION", "BLOCK"].includes(value.status), "checkResult.status is invalid.");
  assert(Array.isArray(value.checks), "checkResult.checks must be an array.");
}

function assertObject(value, path) {
  assert(typeof value === "object" && value !== null && !Array.isArray(value), `${path} must be an object.`);
}

function assertNonEmptyString(value, path) {
  assert(typeof value === "string" && value.trim() !== "", `${path} must be a non-empty string.`);
}

function assertNonEmptyStringArray(value, path) {
  assert(Array.isArray(value) && value.length > 0, `${path} must be a non-empty array.`);
  value.forEach((item, index) => assertNonEmptyString(item, `${path}[${index}]`));
}

function error(path, message) {
  return { path, message };
}

function assert(value, message) {
  if (!value) throw new Error(message);
}
