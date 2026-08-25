import { readFile } from "node:fs/promises";
import { join } from "node:path";

const policyPath = process.argv[2];

if (!policyPath) {
  throw new Error("Usage: <static-a11y-checker> <policy.json>");
}

const policy = JSON.parse(await readFile(join(process.cwd(), policyPath), "utf8"));
validatePolicy(policy);

const contents = await Promise.all(
  policy.files.map(async (file) => [file, await readFile(join(process.cwd(), file), "utf8")])
);

const failures = [];

for (const [file, content] of contents) {
  for (const rule of policy.fileRules) {
    if (content.includes(rule.whenContains) && !content.includes(rule.requireContains)) {
      failures.push(`${file}: ${rule.message}`);
    }
  }
}

const allContent = contents.map(([, content]) => content).join("\n");
for (const rule of policy.aggregateRules) {
  if (!rule.anyOf.some((value) => allContent.includes(value))) {
    failures.push(rule.message);
  }
}

if (failures.length > 0) {
  throw new Error(`Static a11y check failed:\n${failures.join("\n")}`);
}

console.log("Static a11y check OK");

function validatePolicy(policyToValidate) {
  assert(policyToValidate.schemaVersion === "static-a11y-policy.v1", "policy.schemaVersion must be static-a11y-policy.v1.");
  assert(Array.isArray(policyToValidate.files) && policyToValidate.files.length > 0, "policy.files must be a non-empty array.");
  assert(Array.isArray(policyToValidate.fileRules), "policy.fileRules must be an array.");
  assert(Array.isArray(policyToValidate.aggregateRules), "policy.aggregateRules must be an array.");
}

function assert(value, message) {
  if (!value) {
    throw new Error(message);
  }
}
