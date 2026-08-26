import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const configPath = process.argv[2];

if (!configPath) {
  console.error("Usage: node run-text-quality-gate.mjs <config.json>");
  process.exit(2);
}

const root = process.cwd();
const config = JSON.parse(await readFile(resolve(root, configPath), "utf8"));

validateConfig(config);

const checks = [];

for (const target of config.targets) {
  const targetPath = resolve(root, target.path);
  const text = await readFile(targetPath, "utf8");

  for (const rule of config.rules) {
    checks.push(runRule({ target, rule, text }));
  }
}

const failed = checks.filter((check) => check.status === "failed");
const result = {
  schemaVersion: "text-quality-gate-result.v1",
  gateId: config.gateId,
  status: failed.length === 0 ? "ok" : "failed",
  checkedAt: new Date().toISOString(),
  checkedTargets: config.targets.length,
  checkedRules: config.rules.length,
  failedCount: failed.length,
  checks
};

const output = `${JSON.stringify(result, null, 2)}\n`;

if (config.outputPath) {
  const outputPath = resolve(root, config.outputPath);
  await writeFile(outputPath, output);
  console.log(`Wrote result: ${outputPath}`);
} else {
  process.stdout.write(output);
}

process.exit(result.status === "ok" ? 0 : 1);

function runRule({ target, rule, text }) {
  const base = {
    targetId: target.id,
    targetPath: target.path,
    ruleId: rule.ruleId,
    type: rule.type,
    message: rule.message
  };

  if (rule.type === "mustInclude") {
    const ok = text.includes(rule.value);
    return { ...base, status: ok ? "ok" : "failed", expected: `include: ${rule.value}` };
  }

  if (rule.type === "mustNotInclude") {
    const ok = !text.includes(rule.value);
    return { ...base, status: ok ? "ok" : "failed", expected: `not include: ${rule.value}` };
  }

  if (rule.type === "regexMustMatch") {
    const regex = new RegExp(rule.pattern, rule.flags ?? "");
    const ok = regex.test(text);
    return { ...base, status: ok ? "ok" : "failed", expected: `match: ${rule.pattern}` };
  }

  if (rule.type === "regexMustNotMatch") {
    const regex = new RegExp(rule.pattern, rule.flags ?? "");
    const ok = !regex.test(text);
    return { ...base, status: ok ? "ok" : "failed", expected: `not match: ${rule.pattern}` };
  }

  if (rule.type === "maxOccurrences") {
    const count = countOccurrences(text, rule.value);
    const ok = count <= rule.max;
    return { ...base, status: ok ? "ok" : "failed", expected: `count(${rule.value}) <= ${rule.max}`, actual: count };
  }

  return { ...base, status: "failed", expected: "known rule type" };
}

function validateConfig(configToValidate) {
  assert(configToValidate.schemaVersion === "text-quality-gate.v1", "schemaVersion must be text-quality-gate.v1");
  assertString(configToValidate.gateId, "gateId");
  assert(Array.isArray(configToValidate.targets) && configToValidate.targets.length > 0, "targets must be a non-empty array");
  assert(Array.isArray(configToValidate.rules) && configToValidate.rules.length > 0, "rules must be a non-empty array");

  for (const target of configToValidate.targets) {
    assertString(target.id, "target.id");
    assertString(target.path, "target.path");
  }

  for (const rule of configToValidate.rules) {
    assertString(rule.ruleId, "rule.ruleId");
    assertString(rule.type, "rule.type");
    assertString(rule.message, "rule.message");

    if (rule.type === "mustInclude" || rule.type === "mustNotInclude" || rule.type === "maxOccurrences") {
      assertString(rule.value, `${rule.ruleId}.value`);
    }

    if (rule.type === "maxOccurrences") {
      assert(Number.isInteger(rule.max) && rule.max >= 0, `${rule.ruleId}.max must be a non-negative integer`);
    }

    if (rule.type === "regexMustMatch" || rule.type === "regexMustNotMatch") {
      assertString(rule.pattern, `${rule.ruleId}.pattern`);
    }
  }

  if (configToValidate.outputPath) {
    assertString(configToValidate.outputPath, "outputPath");
    assert(dirname(configToValidate.outputPath) !== ".", "outputPath must include a directory");
  }
}

function assertString(value, label) {
  assert(typeof value === "string" && value.length > 0, `${label} is required`);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function countOccurrences(text, value) {
  if (value.length === 0) return 0;

  let count = 0;
  let index = 0;

  while (true) {
    index = text.indexOf(value, index);
    if (index === -1) return count;
    count += 1;
    index += value.length;
  }
}
