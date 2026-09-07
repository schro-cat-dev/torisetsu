#!/usr/bin/env node
import { access, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assertJsonSchema, readJsonFile } from "./json-schema-validator.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    const value = argv[index + 1];
    const names = { "--manifest": "manifest", "--profile": "profile", "--baseline-dir": "baselineDir" };
    if (Object.hasOwn(names, key)) {
      if (!value || value.startsWith("--")) throw new Error(`${key} requires a value`);
      args[names[key]] = value;
      index += 1;
      continue;
    }
    throw new Error(`unknown argument: ${key}`);
  }
  if (!args.manifest || !args.profile || !args.baselineDir) throw new Error("--manifest, --profile, and --baseline-dir are required");
  return args;
}

export async function checkVisualManifest({ manifestPath, profilePath, baselineDirectory }) {
  const contractsDirectory = path.resolve(scriptDirectory, "../contracts");
  const manifest = await readJsonFile(manifestPath);
  const profile = await readJsonFile(profilePath);
  const manifestSchema = await readJsonFile(path.join(contractsDirectory, "ui-visual-manifest.schema.json"));
  const thresholdSchema = await readJsonFile(path.join(contractsDirectory, "ui-visual-threshold-policy.schema.json"));
  assertJsonSchema(manifest, manifestSchema, "visual manifest");
  const thresholdPath = path.resolve(path.dirname(manifestPath), manifest.thresholdPolicyRef);
  const threshold = await readJsonFile(thresholdPath);
  assertJsonSchema(threshold, thresholdSchema, "visual threshold policy");

  const caseIds = manifest.cases.map((item) => item.id);
  const screenshotNames = manifest.cases.map((item) => item.screenshotName);
  assertUnique(caseIds, "visual case id");
  assertUnique(screenshotNames, "visual screenshot name");
  const requiredCaseIds = [...new Set(profile.rules.filter((rule) => rule.assertion === "visualCoverageComplete").flatMap((rule) => rule.params.requiredCaseIds))];
  if (requiredCaseIds.length === 0) throw new Error("profile has no visualCoverageComplete requiredCaseIds");
  const missingCases = requiredCaseIds.filter((id) => !caseIds.includes(id));
  const undeclaredCases = caseIds.filter((id) => !requiredCaseIds.includes(id));
  if (missingCases.length > 0 || undeclaredCases.length > 0) {
    throw new Error(`visual manifest/profile mismatch: missing=${missingCases.join(",")} undeclared=${undeclaredCases.join(",")}`);
  }

  for (const boundaryCase of threshold.boundaryCases) {
    const actual = boundaryCase.actual <= threshold.maxDiffPixelRatio ? "passed" : "failed";
    if (actual !== boundaryCase.expected) throw new Error(`threshold boundary mismatch at ${boundaryCase.actual}: expected ${boundaryCase.expected}, got ${actual}`);
  }

  const missingBaselines = [];
  for (const screenshotName of screenshotNames) {
    try {
      await access(path.resolve(baselineDirectory, screenshotName));
    } catch {
      missingBaselines.push(screenshotName);
    }
  }
  if (missingBaselines.length > 0) throw new Error(`visual baselines are missing: ${missingBaselines.join(", ")}`);
  const actualBaselines = (await readdir(baselineDirectory)).filter((name) => name.endsWith(".png"));
  const undeclaredBaselines = actualBaselines.filter((name) => !screenshotNames.includes(name));
  if (undeclaredBaselines.length > 0) throw new Error(`visual baselines are not declared in the manifest: ${undeclaredBaselines.join(", ")}`);
  return { caseCount: caseIds.length, maxDiffPixelRatio: threshold.maxDiffPixelRatio, baselineCount: screenshotNames.length };
}

function assertUnique(values, label) {
  if (new Set(values).size !== values.length) throw new Error(`${label} must be unique`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const result = await checkVisualManifest({ manifestPath: path.resolve(args.manifest), profilePath: path.resolve(args.profile), baselineDirectory: path.resolve(args.baselineDir) });
  process.stdout.write(`${JSON.stringify({ status: "ok", ...result }, null, 2)}\n`);
}

if (path.resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
