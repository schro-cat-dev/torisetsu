import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const metadata = {
  schemaVersion: "tester-module.v1",
  name: "json-field-equals",
  inputContract: {
    checks: "Array<{ file: string, path: string[], equals: string | number | boolean | null }>"
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
    if (!Array.isArray(check.path) || check.path.length === 0) {
      throw new Error(`${theme}: input.checks[${index}].path must be a non-empty array.`);
    }
    if (!("equals" in check)) {
      throw new Error(`${theme}: input.checks[${index}].equals is required.`);
    }
  }
}

export async function run({ spec, context }) {
  const checks = spec.input.checks;

  let assertionCount = 0;

  for (const check of checks) {
    const file = check.file;
    const path = check.path;

    const json = JSON.parse(await readFile(join(context.root, file), "utf8"));
    const actual = path.reduce((value, key) => value?.[key], json);
    assertionCount += 1;

    if (actual !== check.equals) {
      throw new Error(`${spec.theme}: ${file}.${path.join(".")} expected ${check.equals}, got ${actual}`);
    }
  }

  return { assertionCount };
}
