import { spawn } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const scenarioPath = process.argv[2];

if (!scenarioPath) {
  throw new Error("Usage: <api-flow-runner> <scenario.json>");
}
const scenario = JSON.parse(await readFile(join(process.cwd(), scenarioPath), "utf8"));

validateScenario(scenario);

const serverConfig = scenario.server;
const apiBase = `${serverConfig.protocol}://${serverConfig.host}:${serverConfig.port}${serverConfig.basePath}`;
const dataPath = serverConfig.restoreFileAfterRun ? join(process.cwd(), serverConfig.restoreFileAfterRun) : "";
const originalData = dataPath ? await readFile(dataPath, "utf8") : "";
const server = spawn(serverConfig.command, serverConfig.args ?? [], {
  cwd: process.cwd(),
  env: { ...process.env, [serverConfig.portEnv]: String(serverConfig.port) },
  stdio: ["ignore", "pipe", "pipe"]
});
const state = {};
let serverStdErr = "";

server.stderr.on("data", (chunk) => {
  serverStdErr += chunk.toString();
});

try {
  await waitForHealth();

  for (const step of scenario.steps) {
    const result = await runStep(step);
    applySaves(step, result);
  }

  console.log(`API flow OK: ${scenario.name} ${scenario.steps.length} steps`);
} finally {
  server.kill();
  if (dataPath) {
    await writeFile(dataPath, originalData);
  }
}

async function runStep(step) {
  const path = interpolate(step.request.path);
  const response = await request(path, {
    method: step.request.method,
    body: step.request.body === undefined ? undefined : JSON.stringify(interpolateValue(step.request.body))
  });

  assert(response.status === step.expect.status, `${step.name}: expected status ${step.expect.status}, got ${response.status}`);

  const responseBody = response.contentType.includes("application/json") ? JSON.parse(response.bodyText) : response.bodyText;
  validateExpectedBody(step.name, responseBody, step.expect.body ?? {});
  return responseBody;
}

async function request(path, init = {}) {
  const response = await fetch(`${apiBase}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init
  });

  return {
    status: response.status,
    contentType: response.headers.get("content-type") ?? "",
    bodyText: await response.text()
  };
}

async function waitForHealth() {
  const started = Date.now();
  while (Date.now() - started < serverConfig.healthTimeoutMs) {
    try {
      const health = await request(serverConfig.healthPath);
      if (health.status === 200) return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  throw new Error(`API server did not become healthy.\n${serverStdErr}`);
}

function validateExpectedBody(stepName, body, expectedBody) {
  for (const assertion of expectedBody.assertions ?? []) {
    const actual = readJsonPath(body, assertion.path);
    if (assertion.type) {
      assert(typeof actual === assertion.type, `${stepName}: ${assertion.path} must be ${assertion.type}.`);
    }
    if (assertion.nonEmpty) {
      assert(typeof actual === "string" && actual.trim().length > 0, `${stepName}: ${assertion.path} must not be empty.`);
    }
    if ("equals" in assertion) {
      assert(actual === assertion.equals, `${stepName}: ${assertion.path} expected ${assertion.equals}, got ${actual}`);
    }
  }
}

function applySaves(step, body) {
  for (const [key, path] of Object.entries(step.save ?? {})) {
    const value = readJsonPath(body, path);
    assert(value !== undefined, `${step.name}: save path not found: ${path}`);
    state[key] = value;
  }
}

function readJsonPath(value, path) {
  assert(path.startsWith("$."), `Unsupported JSON path: ${path}`);
  return path.slice(2).split(".").reduce((current, key) => current?.[key], value);
}

function interpolate(value) {
  return value.replace(/\$\{([a-zA-Z0-9_]+)\}/g, (_, key) => {
    assert(Object.hasOwn(state, key), `State value not found: ${key}`);
    return state[key];
  });
}

function interpolateValue(value) {
  if (typeof value === "string") return interpolate(value);
  if (Array.isArray(value)) return value.map((item) => interpolateValue(item));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, interpolateValue(item)]));
  }
  return value;
}

function validateScenario(scenarioToValidate) {
  assert(scenarioToValidate.schemaVersion === "api-flow-scenario.v1", "scenario.schemaVersion must be api-flow-scenario.v1.");
  assert(typeof scenarioToValidate.name === "string" && scenarioToValidate.name, "scenario.name is required.");
  assert(scenarioToValidate.server && typeof scenarioToValidate.server === "object", "scenario.server is required.");
  assert(["http", "https"].includes(scenarioToValidate.server.protocol), "scenario.server.protocol must be http or https.");
  assert(typeof scenarioToValidate.server.host === "string" && scenarioToValidate.server.host, "scenario.server.host is required.");
  assert(typeof scenarioToValidate.server.port === "number", "scenario.server.port must be a number.");
  assert(typeof scenarioToValidate.server.portEnv === "string", "scenario.server.portEnv is required.");
  assert(typeof scenarioToValidate.server.command === "string", "scenario.server.command is required.");
  assert(Array.isArray(scenarioToValidate.server.args), "scenario.server.args must be an array.");
  assert(typeof scenarioToValidate.server.basePath === "string", "scenario.server.basePath is required.");
  assert(typeof scenarioToValidate.server.healthPath === "string", "scenario.server.healthPath is required.");
  assert(typeof scenarioToValidate.server.healthTimeoutMs === "number", "scenario.server.healthTimeoutMs must be a number.");
  assert(Array.isArray(scenarioToValidate.steps) && scenarioToValidate.steps.length > 0, "scenario.steps must be a non-empty array.");

  const seen = new Set();
  for (const [index, step] of scenarioToValidate.steps.entries()) {
    assert(typeof step.name === "string" && step.name, `steps[${index}].name is required.`);
    assert(!seen.has(step.name), `steps[${index}].name is duplicated: ${step.name}`);
    assert(step.request && typeof step.request === "object", `${step.name}: request is required.`);
    assert(typeof step.request.method === "string", `${step.name}: request.method is required.`);
    assert(typeof step.request.path === "string", `${step.name}: request.path is required.`);
    assert(step.expect && typeof step.expect.status === "number", `${step.name}: expect.status is required.`);
    seen.add(step.name);
  }
}

function assert(value, message) {
  if (!value) {
    throw new Error(message);
  }
}
