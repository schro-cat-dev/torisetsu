#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assertJsonSchema, readJsonFile } from "./json-schema-validator.mjs";
import { assertAdapter, defaultContractPaths, loadContracts, validateProfile } from "./profile-contract.mjs";

const RESULT_VERSION = "ui-quality-harness-result.v1";
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    const value = argv[index + 1];
    if (["--profile", "--out"].includes(key)) {
      if (!value || value.startsWith("--")) throw new Error(`${key} requires a value`);
      args[key.slice(2)] = value;
      index += 1;
      continue;
    }
    throw new Error(`unknown argument: ${key}`);
  }
  if (!args.profile) throw new Error("--profile is required");
  return args;
}

async function validateConfigRefs(profile, profilePath, contracts, issues) {
  const profileDirectory = path.dirname(path.resolve(profilePath));
  const ruleById = new Map(profile.rules.map((rule) => [rule.id, rule]));
  const scenarioIds = new Set(profile.scenarios.map((scenario) => scenario.id));

  for (const [index, source] of profile.evidenceSources.entries()) {
    if (!source.configRef) continue;
    const issuePath = `$.evidenceSources[${index}].configRef`;
    try {
      const configPath = resolveInside(profileDirectory, source.configRef, issuePath);
      const adapter = await readJsonFile(configPath);
      assertAdapter(adapter, contracts, configPath);
      for (const ruleId of adapter.inputContract.profileRuleIds) {
        const rule = ruleById.get(ruleId);
        if (!rule) {
          issues.push({ path: issuePath, message: `adapter references unknown rule: ${ruleId}` });
        } else if (!rule.evidenceSourceIds.includes(source.id)) {
          issues.push({ path: issuePath, message: `rule ${ruleId} does not reference evidence source ${source.id}` });
        }
      }
      for (const scenarioId of adapter.inputContract.profileScenarioIds) {
        if (!scenarioIds.has(scenarioId)) issues.push({ path: issuePath, message: `adapter references unknown scenario: ${scenarioId}` });
      }
    } catch (error) {
      issues.push({ path: issuePath, message: error instanceof Error ? error.message : String(error) });
    }
  }
}

function resolveInside(baseDirectory, relativePath, label) {
  const resolved = path.resolve(baseDirectory, relativePath);
  if (resolved !== baseDirectory && !resolved.startsWith(`${baseDirectory}${path.sep}`)) {
    throw new Error(`${label} must stay inside the profile directory`);
  }
  return resolved;
}

function buildResult(profile, issues) {
  return {
    schemaVersion: RESULT_VERSION,
    status: issues.length === 0 ? "ok" : "failed",
    profileId: typeof profile?.profileId === "string" ? profile.profileId : "",
    checkedAt: new Date().toISOString(),
    summary: {
      gateCount: Array.isArray(profile?.gates) ? profile.gates.length : 0,
      ruleCount: Array.isArray(profile?.rules) ? profile.rules.length : 0,
      scenarioCount: Array.isArray(profile?.scenarios) ? profile.scenarios.length : 0,
      evidenceSourceCount: Array.isArray(profile?.evidenceSources) ? profile.evidenceSources.length : 0
    },
    issues,
    reviewRequired: (profile?.rules ?? [])
      .filter((rule) => rule.checkKind === "judgment")
      .map((rule) => ({ id: rule.id, gateId: rule.gateId, reason: "judgment evidence must be supplied to the final orchestrator" }))
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const contracts = await loadContracts(defaultContractPaths(scriptDirectory));
  const profile = await readJsonFile(args.profile);
  const issues = validateProfile(profile, contracts.profile, contracts.assertionCatalog);
  if (issues.length === 0) await validateConfigRefs(profile, args.profile, contracts, issues);
  const result = buildResult(profile, issues);
  assertJsonSchema(result, contracts.profileResult, "profile validation result");
  const output = `${JSON.stringify(result, null, 2)}\n`;
  if (args.out) {
    await mkdir(path.dirname(args.out), { recursive: true });
    await writeFile(args.out, output, "utf8");
  } else {
    process.stdout.write(output);
  }
  process.exitCode = issues.length === 0 ? 0 : 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 2;
});
