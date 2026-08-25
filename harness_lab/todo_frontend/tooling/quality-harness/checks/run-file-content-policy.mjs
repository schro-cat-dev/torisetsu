import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";

const root = process.cwd();
const policyPath = process.argv[2];
const outputDir = process.env.HARNESS_RUN_DIR;

if (!policyPath) {
  throw new Error("Usage: <file-content-policy-runner> <policy.json>");
}

const policy = JSON.parse(await readFile(join(root, policyPath), "utf8"));
validatePolicy(policy);

const violations = [];

for (const target of policy.targets) {
  const files = await listFiles(join(root, target.dir), new Set(target.extensions));
  for (const file of files) {
    await checkFile(file, target);
  }
}

await writeResult(policy, violations);

if (violations.length > 0) {
  throw new Error(`${policy.name} failed:\n${violations.join("\n")}`);
}

console.log(`File content policy OK: ${policy.name}`);

async function checkFile(file, target) {
  const content = await readFile(file, "utf8");

  for (const rule of policy.forbidden) {
    if (rule.match === "identifier-prefix") {
      const lines = content.split("\n");
      for (const [index, line] of lines.entries()) {
        if (containsIdentifierPrefix(line, rule.value)) {
          violations.push(`${file}:${index + 1}: ${rule.id}`);
        }
      }
      continue;
    }

    if (rule.match === "contains") {
      if (content.includes(rule.value)) {
        violations.push(`${file}: ${rule.id}`);
      }
      continue;
    }

    throw new Error(`${target.dir}: unsupported forbidden match: ${rule.match}`);
  }
}

async function listFiles(dir, extensions) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFiles(path, extensions)));
      continue;
    }

    if (entry.isFile() && extensions.has(extname(entry.name))) {
      files.push(path);
    }
  }

  return files.sort();
}

async function writeResult(policyToWrite, violationsToWrite) {
  if (!outputDir) return;

  await mkdir(outputDir, { recursive: true });
  const payload = {
    schemaVersion: "file-content-policy-result.v1",
    generatedAt: new Date().toISOString(),
    name: policyToWrite.name,
    policyPath,
    checkedTargets: policyToWrite.targets.map((target) => target.dir),
    violationCount: violationsToWrite.length,
    status: violationsToWrite.length === 0 ? "ok" : "failed",
    violations: violationsToWrite
  };
  await writeFile(join(outputDir, policyToWrite.result.fileName), `${JSON.stringify(payload, null, 2)}\n`);
}

function validatePolicy(policyToValidate) {
  assert(policyToValidate.schemaVersion === "file-content-policy.v1", "policy.schemaVersion must be file-content-policy.v1.");
  assert(typeof policyToValidate.name === "string" && policyToValidate.name, "policy.name is required.");
  assert(Array.isArray(policyToValidate.targets) && policyToValidate.targets.length > 0, "policy.targets must be a non-empty array.");
  assert(Array.isArray(policyToValidate.forbidden) && policyToValidate.forbidden.length > 0, "policy.forbidden must be a non-empty array.");
  assert(policyToValidate.result && typeof policyToValidate.result.fileName === "string", "policy.result.fileName is required.");

  for (const [index, target] of policyToValidate.targets.entries()) {
    assert(typeof target.dir === "string" && target.dir, `targets[${index}].dir is required.`);
    assert(Array.isArray(target.extensions) && target.extensions.length > 0, `targets[${index}].extensions must be a non-empty array.`);
  }

  for (const [index, rule] of policyToValidate.forbidden.entries()) {
    assert(typeof rule.id === "string" && rule.id, `forbidden[${index}].id is required.`);
    assert(typeof rule.value === "string" && rule.value, `forbidden[${index}].value is required.`);
    assert(["identifier-prefix", "contains"].includes(rule.match), `forbidden[${index}].match is invalid.`);
  }
}

function containsIdentifierPrefix(line, prefix) {
  const pattern = new RegExp(`(^|[^a-zA-Z0-9_$])${escapeRegExp(prefix)}[a-zA-Z0-9_$]*\\b`);
  return pattern.test(line);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function assert(value, message) {
  if (!value) {
    throw new Error(message);
  }
}
