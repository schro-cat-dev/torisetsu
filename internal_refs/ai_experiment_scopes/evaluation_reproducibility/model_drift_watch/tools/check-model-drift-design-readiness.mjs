/*
Purpose:
  Check whether model drift watch design documents contain the handoff sections
  required before implementing the next tool slice.

Execution prerequisites:
  Run from the repository root with Node.js. The first argument must be a JSON
  config file using schemaVersion "model-drift-design-readiness-check-config.v1".

Usage:
  node internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/tools/check-model-drift-design-readiness.mjs <config.json>

Example:
  node internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/tools/check-model-drift-design-readiness.mjs internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/configs/design-readiness-check.config.json

Failure check:
  If status is FAIL, open result.failedChecks[].file and add the missing section
  named by result.failedChecks[].missingText.
*/

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const configPath = process.argv[2];
const root = process.cwd();

if (!configPath) {
  throw new Error("Usage: node check-model-drift-design-readiness.mjs <config.json>");
}

const config = JSON.parse(await readFile(join(root, configPath), "utf8"));
validateConfig(config);

const targetResults = [];
const failedChecks = [];

for (const target of config.targets) {
  const content = await readFile(join(root, target.file), "utf8");
  const missingText = target.requiredText.filter((text) => !content.includes(text));
  const status = missingText.length === 0 ? "PASS" : "FAIL";
  targetResults.push({
    file: target.file,
    status,
    requiredTextCount: target.requiredText.length,
    missingText
  });

  for (const text of missingText) {
    failedChecks.push({
      id: `${target.file}:${text}`,
      file: target.file,
      missingText: text,
      message: "required design handoff text is missing"
    });
  }
}

const status = failedChecks.length === 0 ? "PASS" : "FAIL";
const result = {
  schemaVersion: "model-drift-design-readiness-check-result.v1",
  generatedAt: new Date().toISOString(),
  configPath,
  status,
  summary: {
    targetCount: config.targets.length,
    failedTargetCount: targetResults.filter((item) => item.status === "FAIL").length,
    failedCheckCount: failedChecks.length
  },
  targets: targetResults,
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
  assert(value.schemaVersion === "model-drift-design-readiness-check-config.v1", "config.schemaVersion must be model-drift-design-readiness-check-config.v1.");
  assertNonEmptyString(value.checkId, "config.checkId");
  assert(Array.isArray(value.targets) && value.targets.length > 0, "config.targets must be a non-empty array.");
  assertObject(value.output, "config.output");
  assertNonEmptyString(value.output.file, "config.output.file");
  assert(Array.isArray(value.output.failStatuses), "config.output.failStatuses must be an array.");

  value.targets.forEach((target, index) => {
    assertObject(target, `config.targets[${index}]`);
    assertNonEmptyString(target.file, `config.targets[${index}].file`);
    assertNonEmptyStringArray(target.requiredText, `config.targets[${index}].requiredText`);
  });
}

function assertObject(value, path) {
  assert(typeof value === "object" && value !== null && !Array.isArray(value), `${path} must be an object.`);
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

function assert(value, message) {
  if (!value) throw new Error(message);
}
