#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fileSha256, sha256 } from "./artifact-identity.mjs";
import { assertJsonSchema, readJsonFile } from "./json-schema-validator.mjs";
import { assertAdapter, assertProfile, defaultContractPaths, loadContracts } from "./profile-contract.mjs";

const AGGREGATE_VERSION = "ui-quality-aggregate-result.v1";
const ADAPTER_RESULT_VERSION = "ui-quality-adapter-result.v1";
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));

function parseArgs(argv) {
  const args = { root: process.cwd() };
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    const value = argv[index + 1];
    if (["--profile", "--root", "--run-dir", "--out"].includes(key)) {
      if (!value || value.startsWith("--")) throw new Error(`${key} requires a value`);
      args[key === "--run-dir" ? "runDir" : key.slice(2)] = value;
      index += 1;
      continue;
    }
    throw new Error(`unknown argument: ${key}`);
  }
  if (!args.profile) throw new Error("--profile is required");
  return args;
}

export async function runUiQualityHarness(options) {
  const root = path.resolve(options.root);
  const profilePath = resolveInside(root, options.profile, "profile");
  const runDir = resolveInside(root, options.runDir ?? `.ui-quality-runs/${runId()}`, "run directory");
  await mkdir(runDir, { recursive: true });

  const contracts = await loadContracts(defaultContractPaths(scriptDirectory));
  const profile = await readJsonFile(profilePath);
  assertProfile(profile, contracts);
  const profileHash = await fileSha256(profilePath);
  const profileDirectory = path.dirname(profilePath);
  const adapterResults = [];
  const sourceSummaries = [];

  for (const source of profile.evidenceSources) {
    if (!source.configRef) throw new Error(`evidence source requires configRef for end-to-end execution: ${source.id}`);
    const adapterPath = resolveInside(root, path.resolve(profileDirectory, source.configRef), `configRef for ${source.id}`);
    const adapter = await readJsonFile(adapterPath);
    assertAdapter(adapter, contracts, adapterPath);
    validateAdapterMapping(profile, source.id, adapter);
    const adapterResultPath = path.join(runDir, `${safeName(source.id)}.adapter-result.json`);
    const commandResults = [];
    for (const command of adapter.execution.commands) {
      const failedDependencies = findFailedDependencies(command, commandResults);
      const commandResult = failedDependencies.length > 0
        ? {
            id: command.id,
            commandText: [command.executable, ...command.args].join(" "),
            exitCode: 125,
            timedOut: false,
            outcome: "dependency_failed",
            failedDependencies,
            stdout: "",
            stderr: `required commands did not pass: ${failedDependencies.join(", ")}\n`
          }
        : await executeCommand(command, {
            root,
            profilePath,
            sourceId: source.id,
            runDir,
            adapterResultPath
          });
      commandResults.push(commandResult);
      await writeFile(path.join(runDir, `${safeName(source.id)}-${safeName(command.id)}.log`), `${commandResult.stdout}\n${commandResult.stderr}`, "utf8");
    }

    let adapterResult;
    let actualAdapterResultPath = adapterResultPath;
    const commandFailed = commandResults.some((item) => item.outcome !== "passed");
    if (adapter.outputContract.resultMode === "result_file" && !commandFailed) {
      const configuredResultPath = expandRuntimeTokens(adapter.outputContract.resultFile, { root, profilePath, sourceId: source.id, runDir, adapterResultPath });
      const resolvedResultPath = resolveInside(runDir, configuredResultPath, `result file for ${source.id}`);
      actualAdapterResultPath = resolvedResultPath;
      adapterResult = await readJsonFile(resolvedResultPath);
      assertJsonSchema(adapterResult, contracts.adapterResult, `adapter result for ${source.id}`);
    } else {
      adapterResult = buildCommandStatusResult(profile, profileHash, source.id, adapter, commandResults);
      assertJsonSchema(adapterResult, contracts.adapterResult, `adapter result for ${source.id}`);
      await writeFile(adapterResultPath, `${JSON.stringify(adapterResult, null, 2)}\n`, "utf8");
    }

    if (adapterResult.profileId !== profile.profileId || adapterResult.evidenceSourceId !== source.id) {
      throw new Error(`adapter result identity mismatch for ${source.id}`);
    }
    if (adapterResult.inputIdentity.profileSha256 !== profileHash) {
      throw new Error(`adapter result profile hash mismatch for ${source.id}`);
    }
    adapterResults.push(adapterResult);
    sourceSummaries.push({
      id: source.id,
      adapterId: adapter.adapterId,
      status: adapterResult.status,
      resultPath: path.relative(root, actualAdapterResultPath),
      commands: commandResults.map(({ id, commandText, exitCode, timedOut, outcome, failedDependencies = [] }) => ({ id, commandText, exitCode, timedOut, outcome, failedDependencies }))
    });
  }

  const aggregate = aggregateResults(profile, profileHash, adapterResults, sourceSummaries, contracts.assertionCatalog);
  assertJsonSchema(aggregate, contracts.aggregateResult, "aggregate result");
  return { aggregate, runDir };
}

function buildCommandStatusResult(profile, profileHash, sourceId, adapter, commandResults) {
  const ruleById = new Map(profile.rules.map((rule) => [rule.id, rule]));
  const failed = commandResults.length !== adapter.execution.commands.length || commandResults.some((item) => item.outcome !== "passed");
  const commandSummary = commandResults.map(({ id, commandText, exitCode, timedOut, outcome, failedDependencies = [] }) => ({ id, commandText, exitCode, timedOut, outcome, failedDependencies }));
  return {
    schemaVersion: ADAPTER_RESULT_VERSION,
    status: failed ? "failed" : "ok",
    adapterId: adapter.adapterId,
    profileId: profile.profileId,
    evidenceSourceId: sourceId,
    checkedAt: new Date().toISOString(),
    producer: { command: "run-ui-quality-harness.mjs", version: AGGREGATE_VERSION },
    inputIdentity: { profileSha256: profileHash, artifactSha256: sha256(commandSummary) },
    results: adapter.inputContract.profileRuleIds.map((ruleId) => {
      const rule = ruleById.get(ruleId);
      return {
        ruleId,
        gateId: rule?.gateId ?? "",
        status: failed ? "failed" : "passed",
        message: failed ? "one or more adapter commands failed" : "all adapter commands passed",
        evidence: { commands: commandSummary },
        scenarioIds: adapter.inputContract.profileScenarioIds,
        claims: adapter.inputContract.claims
      };
    })
  };
}

export function aggregateResults(profile, profileHash, adapterResults, sourceSummaries, assertionCatalog) {
  const resultsBySource = new Map(adapterResults.map((item) => [item.evidenceSourceId, item]));
  const rules = profile.rules.map((rule) => aggregateRule(rule, resultsBySource, assertionCatalog));
  const scenarios = profile.scenarios.map((scenario) => {
    const linked = rules.filter((rule) => rule.scenarioIds.includes(scenario.id));
    const covered = linked.some((rule) => rule.coveredScenarioIds.includes(scenario.id));
    return { id: scenario.id, status: covered && linked.every((rule) => rule.status !== "failed") ? "passed" : "failed", linkedRuleIds: linked.map((rule) => rule.id) };
  });
  const gates = profile.gates.map((gate) => {
    const gateRules = rules.filter((rule) => rule.gateId === gate.id);
    let status = gateRules.length === 0 || gateRules.some((rule) => rule.status === "failed") ? "failed" : gateRules.some((rule) => rule.status === "warning") ? "warning" : "passed";
    if (gate.blocking && status === "warning") status = "failed";
    return { id: gate.id, blocking: gate.blocking, status, ruleIds: gateRules.map((rule) => rule.id) };
  });
  const issues = [];
  for (const rule of rules.filter((item) => item.status === "failed")) issues.push({ path: `$.rules.${rule.id}`, message: rule.message });
  for (const scenario of scenarios.filter((item) => item.status === "failed")) issues.push({ path: `$.scenarios.${scenario.id}`, message: "scenario evidence is missing or failed" });
  const failed = gates.some((gate) => gate.status === "failed") || scenarios.some((scenario) => scenario.status === "failed");
  const warning = gates.some((gate) => gate.status === "warning");
  return {
    schemaVersion: AGGREGATE_VERSION,
    status: failed ? "failed" : warning ? "warning" : "ok",
    profileId: profile.profileId,
    checkedAt: new Date().toISOString(),
    inputIdentity: { profileSha256: profileHash },
    evidenceSources: sourceSummaries,
    rules,
    scenarios,
    gates,
    issues
  };
}

function aggregateRule(rule, resultsBySource, assertionCatalog) {
  const expectedSources = rule.evidenceSourceIds;
  const matches = [];
  const missingSources = [];
  for (const sourceId of expectedSources) {
    const adapterResult = resultsBySource.get(sourceId);
    const match = adapterResult?.results.find((item) => item.ruleId === rule.id);
    if (match) matches.push({ sourceId, ...match });
    else missingSources.push(sourceId);
  }
  const enoughSources = rule.evidencePolicy === "any" ? matches.length > 0 : missingSources.length === 0;
  const claims = [...new Set(matches.flatMap((item) => item.claims ?? []))];
  const coveredScenarioIds = [...new Set(matches.flatMap((item) => item.scenarioIds ?? []))];
  const requiredClaims = requiredClaimsFor(rule, assertionCatalog);
  const missingClaims = requiredClaims.filter((claim) => !claims.includes(claim));
  const missingScenarios = (rule.scenarioIds ?? []).filter((scenarioId) => !coveredScenarioIds.includes(scenarioId));
  const failedMatch = matches.find((item) => item.status === "failed" || item.status === "skipped");
  const warningMatch = matches.find((item) => item.status === "warning");
  let status = "passed";
  let message = "all required evidence passed";
  if (!enoughSources || matches.length === 0 || failedMatch || missingClaims.length > 0 || missingScenarios.length > 0) {
    status = "failed";
    message = "required evidence is missing, failed, skipped, or incomplete";
  } else if (warningMatch) {
    status = "warning";
    message = "evidence passed with a review warning";
  }
  return {
    id: rule.id,
    gateId: rule.gateId,
    status,
    message,
    expectedEvidenceSourceIds: expectedSources,
    receivedEvidenceSourceIds: matches.map((item) => item.sourceId),
    missingEvidenceSourceIds: missingSources,
    requiredClaims,
    receivedClaims: claims,
    missingClaims,
    scenarioIds: rule.scenarioIds ?? [],
    coveredScenarioIds,
    missingScenarioIds: missingScenarios
  };
}

function requiredClaimsFor(rule, assertionCatalog) {
  const paramNames = assertionCatalog.assertions[rule.assertion]?.requiredClaimParams ?? [];
  return [...new Set(paramNames.flatMap((name) => Array.isArray(rule.params[name]) ? rule.params[name] : [rule.params[name]]).filter(Boolean))];
}

function validateAdapterMapping(profile, sourceId, adapter) {
  const ruleById = new Map(profile.rules.map((rule) => [rule.id, rule]));
  const scenarios = new Set(profile.scenarios.map((scenario) => scenario.id));
  for (const ruleId of adapter.inputContract.profileRuleIds) {
    const rule = ruleById.get(ruleId);
    if (!rule) throw new Error(`${adapter.adapterId} references unknown rule: ${ruleId}`);
    if (!rule.evidenceSourceIds.includes(sourceId)) throw new Error(`${ruleId} does not reference ${sourceId}`);
  }
  for (const scenarioId of adapter.inputContract.profileScenarioIds) {
    if (!scenarios.has(scenarioId)) throw new Error(`${adapter.adapterId} references unknown scenario: ${scenarioId}`);
  }
}

async function executeCommand(command, context) {
  const cwd = resolveInside(context.root, expandRuntimeTokens(command.workingDirectoryRef, context), `workingDirectoryRef for ${command.id}`);
  const executable = command.executable === "node" ? process.execPath : command.executable;
  const args = command.args.map((argument) => expandRuntimeTokens(argument, context));
  const commandText = [command.executable, ...args].join(" ");
  return new Promise((resolve) => {
    const child = spawn(executable, args, { cwd, shell: false, env: { ...process.env, UI_QUALITY_RUN_DIR: context.runDir } });
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    let settled = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
    }, command.timeoutSeconds * 1000);
    child.stdout.on("data", (chunk) => { stdout += chunk.toString(); process.stdout.write(chunk); });
    child.stderr.on("data", (chunk) => { stderr += chunk.toString(); process.stderr.write(chunk); });
    child.on("error", (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ id: command.id, commandText, exitCode: 1, timedOut, outcome: "spawn_failed", failedDependencies: [], stdout, stderr: `${stderr}${error.message}\n` });
    });
    child.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      const exitCode = timedOut ? 124 : code ?? 1;
      resolve({
        id: command.id,
        commandText,
        exitCode,
        timedOut,
        outcome: classifyCommandOutcome({ timedOut, exitCode }),
        failedDependencies: [],
        stdout,
        stderr
      });
    });
  });
}

export function classifyCommandOutcome({ timedOut, exitCode }) {
  if (timedOut) return "timed_out";
  return exitCode === 0 ? "passed" : "command_failed";
}

export function findFailedDependencies(command, commandResults) {
  return (command.requires ?? []).filter((requiredId) => {
    const result = commandResults.find((item) => item.id === requiredId);
    return !result || result.outcome !== "passed";
  });
}

export function exitCodeForAggregateStatus(status) {
  return status === "failed" ? 1 : 0;
}

export function expandRuntimeTokens(value, context) {
  const replacements = {
    "{repoRoot}": context.root,
    "{profilePath}": context.profilePath,
    "{evidenceSourceId}": context.sourceId,
    "{runDir}": context.runDir,
    "{adapterResultPath}": context.adapterResultPath,
    "{platform}": context.platform ?? process.platform
  };
  let output = value;
  for (const [token, replacement] of Object.entries(replacements)) output = output.replaceAll(token, replacement);
  return output;
}

function resolveInside(base, target, label) {
  const resolved = path.resolve(base, target);
  if (resolved !== base && !resolved.startsWith(`${base}${path.sep}`)) throw new Error(`${label} must stay inside ${base}`);
  return resolved;
}

function safeName(value) {
  return value.replace(/[^a-z0-9._-]/giu, "-");
}

function runId() {
  return `${new Date().toISOString().replace(/[:.]/gu, "-")}-${process.pid}`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const { aggregate, runDir } = await runUiQualityHarness(args);
  const outputPath = args.out ? resolveInside(path.resolve(args.root), args.out, "output") : path.join(runDir, "final-result.json");
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(aggregate, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify({ status: aggregate.status, resultPath: outputPath }, null, 2)}\n`);
  process.exitCode = exitCodeForAggregateStatus(aggregate.status);
}

if (path.resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 2;
  });
}
