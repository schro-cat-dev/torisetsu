/*
Purpose:
  Run model drift smoke cases through the OpenAI Responses API and save a raw
  run JSON. This adapter does not grade output by itself; the next step is
  run-model-drift-grader.mjs using the generated rawRunFile.

Execution prerequisites:
  Run from the repository root with Node.js 18+ because this script uses fetch.
  The first argument must be a JSON config file using schemaVersion
  "model-drift-adapter-config.v1" and provider "openai". For live execution,
  set the environment variable named by config.apiKeyEnv.

Usage:
  node internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/tools/run-openai-model-drift-adapter.mjs <config.json>

Example:
  node internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/tools/run-openai-model-drift-adapter.mjs internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/configs/openai-adapter-skip.config.json

Failure check:
  If status is ERROR, open output.rawRunFile and inspect cases[].error. If
  status is SKIP, the adapter did not call the external API.
*/

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const configPath = process.argv[2];
const root = process.cwd();

if (!configPath) {
  throw new Error("Usage: node run-openai-model-drift-adapter.mjs <config.json>");
}

const config = JSON.parse(await readFile(join(root, configPath), "utf8"));
validateConfig(config);

const caseSet = JSON.parse(await readFile(join(root, config.caseSetFile), "utf8"));
validateCaseSet(caseSet);

const startedAt = new Date();
const apiKey = process.env[config.apiKeyEnv];
const shouldSkip = config.executionMode === "skip" || !apiKey;
const skipReason = config.executionMode === "skip" ? "executionMode=skip" : `${config.apiKeyEnv} is not set`;
const cases = [];

if (shouldSkip) {
  for (const caseItem of caseSet.cases) {
    cases.push(buildSkippedCase(caseItem.caseId, skipReason));
  }
} else {
  for (const caseItem of caseSet.cases) {
    cases.push(await runOpenAiCase(config, caseItem, apiKey));
  }
}

const endedAt = new Date();
const status = shouldSkip ? "SKIP" : cases.some((item) => item.status === "ERROR") ? "ERROR" : "OK";
const rawRun = {
  schemaVersion: "model-drift-raw-run.v1",
  runId: config.runId,
  startedAt: startedAt.toISOString(),
  endedAt: endedAt.toISOString(),
  latencyMs: endedAt.getTime() - startedAt.getTime(),
  provider: "openai",
  modelGroup: config.modelGroup,
  model: config.model,
  watchType: config.watchType,
  caseSetFile: config.caseSetFile,
  caseSetId: caseSet.caseSetId,
  settings: config.settings,
  status,
  skipReason: shouldSkip ? skipReason : null,
  cases
};

await mkdir(dirname(join(root, config.output.rawRunFile)), { recursive: true });
await writeFile(join(root, config.output.rawRunFile), `${JSON.stringify(rawRun, null, 2)}\n`);

console.log(JSON.stringify({
  status,
  provider: "openai",
  model: config.model,
  rawRunFile: config.output.rawRunFile,
  caseCount: cases.length,
  skipped: shouldSkip
}, null, 2));

if (config.output.failStatuses.includes(status)) {
  process.exit(1);
}

async function runOpenAiCase(configValue, caseItem, apiKeyValue) {
  const started = Date.now();
  try {
    const response = await fetch(configValue.endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKeyValue}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(buildOpenAiRequest(configValue, caseItem))
    });
    const bodyText = await response.text();
    const body = parseJsonOrText(bodyText);
    if (!response.ok) {
      return buildErrorCase(caseItem.caseId, started, response.status, body);
    }
    const outputText = extractOpenAiText(body);
    return {
      caseId: caseItem.caseId,
      status: "OK",
      latencyMs: Date.now() - started,
      usage: normalizeOpenAiUsage(body.usage),
      stopReason: body.status ?? null,
      outputText,
      rawResponseId: body.id ?? null
    };
  } catch (error) {
    return buildErrorCase(caseItem.caseId, started, null, { message: error.message });
  }
}

function buildOpenAiRequest(configValue, caseItem) {
  const request = {
    model: configValue.model,
    input: caseItem.prompt,
    max_output_tokens: configValue.settings.maxOutputTokens
  };
  if (typeof configValue.settings.temperature === "number") request.temperature = configValue.settings.temperature;
  if (typeof configValue.settings.store === "boolean") request.store = configValue.settings.store;
  if (typeof configValue.settings.reasoningEffort === "string") {
    request.reasoning = { effort: configValue.settings.reasoningEffort };
  }
  return request;
}

function extractOpenAiText(body) {
  if (typeof body.output_text === "string") return body.output_text;
  if (!Array.isArray(body.output)) return "";
  const parts = [];
  for (const item of body.output) {
    if (!Array.isArray(item.content)) continue;
    for (const content of item.content) {
      if (typeof content.text === "string") parts.push(content.text);
    }
  }
  return parts.join("\n");
}

function normalizeOpenAiUsage(usage) {
  return {
    inputTokens: numberOrZero(usage?.input_tokens),
    outputTokens: numberOrZero(usage?.output_tokens),
    totalTokens: numberOrZero(usage?.total_tokens)
  };
}

function buildSkippedCase(caseId, reason) {
  return {
    caseId,
    status: "SKIP",
    latencyMs: 0,
    usage: {
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0
    },
    stopReason: "skip",
    outputText: "",
    skipReason: reason
  };
}

function buildErrorCase(caseId, started, httpStatus, body) {
  return {
    caseId,
    status: "ERROR",
    latencyMs: Date.now() - started,
    usage: {
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0
    },
    stopReason: "error",
    outputText: "",
    error: {
      httpStatus,
      body
    }
  };
}

function parseJsonOrText(value) {
  try {
    return JSON.parse(value);
  } catch {
    return { text: value };
  }
}

function validateConfig(value) {
  assertObject(value, "config");
  assert(value.schemaVersion === "model-drift-adapter-config.v1", "config.schemaVersion must be model-drift-adapter-config.v1.");
  assert(value.provider === "openai", "config.provider must be openai.");
  assert(["skip", "auto"].includes(value.executionMode), "config.executionMode must be skip or auto.");
  assertNonEmptyString(value.runId, "config.runId");
  assertNonEmptyString(value.apiKeyEnv, "config.apiKeyEnv");
  assertNonEmptyString(value.endpoint, "config.endpoint");
  assertNonEmptyString(value.model, "config.model");
  assertNonEmptyString(value.modelGroup, "config.modelGroup");
  assertNonEmptyString(value.watchType, "config.watchType");
  assertNonEmptyString(value.caseSetFile, "config.caseSetFile");
  assertObject(value.settings, "config.settings");
  assert(typeof value.settings.maxOutputTokens === "number" && value.settings.maxOutputTokens > 0, "config.settings.maxOutputTokens must be a positive number.");
  assertObject(value.output, "config.output");
  assertNonEmptyString(value.output.rawRunFile, "config.output.rawRunFile");
  assert(Array.isArray(value.output.failStatuses), "config.output.failStatuses must be an array.");
}

function validateCaseSet(value) {
  assertObject(value, "caseSet");
  assert(value.schemaVersion === "model-drift-case-set.v1", "caseSet.schemaVersion must be model-drift-case-set.v1.");
  assert(Array.isArray(value.cases) && value.cases.length > 0, "caseSet.cases must be a non-empty array.");
}

function numberOrZero(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function assertObject(value, path) {
  assert(typeof value === "object" && value !== null && !Array.isArray(value), `${path} must be an object.`);
}

function assertNonEmptyString(value, path) {
  assert(typeof value === "string" && value.trim() !== "", `${path} must be a non-empty string.`);
}

function assert(value, message) {
  if (!value) throw new Error(message);
}
