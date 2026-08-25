import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const metadata = {
  schemaVersion: "tester-module.v1",
  name: "file-contains",
  inputContract: {
    checks: "Array<{ file: string, contains: string[] }>"
  }
};

export function validateInput(input, theme) {
  const checks = input?.checks;
  if (!Array.isArray(checks) || checks.length === 0) {
    throw new Error(`${theme}: input.checks must be a non-empty array.`);
  }

  for (const [index, check] of checks.entries()) {
    if (!check.file || typeof check.file !== "string") {
      throw new Error(`${theme}: input.checks[${index}].file must be a string.`);
    }
    if (!Array.isArray(check.contains) || check.contains.length === 0) {
      throw new Error(`${theme}: input.checks[${index}].contains must be a non-empty array.`);
    }
    for (const expectedText of check.contains) {
      if (typeof expectedText !== "string" || !expectedText) {
        throw new Error(`${theme}: input.checks[${index}].contains must contain non-empty strings.`);
      }
    }
  }
}

export async function run({ spec, context }) {
  const checks = spec.input.checks;

  let assertionCount = 0;

  for (const check of checks) {
    const file = check.file;
    const contains = check.contains;

    const content = await readFile(join(context.root, file), "utf8");

    for (const expectedText of contains) {
      assertionCount += 1;
      if (!content.includes(expectedText)) {
        throw new Error(`${spec.theme}: ${file} does not contain ${expectedText}`);
      }
    }
  }

  return { assertionCount };
}
