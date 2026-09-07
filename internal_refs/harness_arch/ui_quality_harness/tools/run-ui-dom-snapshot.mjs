#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fileSha256 } from "./artifact-identity.mjs";
import { assertJsonSchema, readJsonFile } from "./json-schema-validator.mjs";
import { assertProfile, defaultContractPaths, loadContracts } from "./profile-contract.mjs";

const RESULT_VERSION = "ui-quality-adapter-result.v1";
const SUPPORTED_ASSERTIONS = new Set(["requiredInfoPresent", "hiddenUnlessExpanded", "primaryBeforeSecondary", "relatedActionsNearTarget", "sameRoleSamePattern"]);
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    const value = argv[index + 1];
    if (["--profile", "--snapshot", "--evidence-source-id", "--out"].includes(key)) {
      if (!value || value.startsWith("--")) throw new Error(`${key} requires a value`);
      args[key === "--evidence-source-id" ? "evidenceSourceId" : key.slice(2)] = value;
      index += 1;
      continue;
    }
    throw new Error(`unknown argument: ${key}`);
  }
  if (!args.profile || !args.snapshot || !args.evidenceSourceId) {
    throw new Error("--profile, --snapshot, and --evidence-source-id are required");
  }
  return args;
}

function mapBy(items, key) {
  return new Map(items.map((item) => [item[key], item]));
}

function edgeGap(first, second) {
  const a = first.boundingBox;
  const b = second.boundingBox;
  const horizontal = Math.max(b.x - (a.x + a.width), a.x - (b.x + b.width), 0);
  const vertical = Math.max(b.y - (a.y + a.height), a.y - (b.y + b.height), 0);
  return Math.round(Math.hypot(horizontal, vertical));
}

function centerDistance(first, second) {
  const a = first.boundingBox;
  const b = second.boundingBox;
  return Math.round(Math.hypot(a.x + a.width / 2 - (b.x + b.width / 2), a.y + a.height / 2 - (b.y + b.height / 2)));
}

function result(rule, status, message, evidence = {}) {
  return { ruleId: rule.id, gateId: rule.gateId, status, message, evidence, scenarioIds: rule.scenarioIds ?? [], claims: [] };
}

function failureStatus(rule) {
  return rule.severity === "warning" || rule.severity === "review" ? "warning" : "failed";
}

function checkRequiredInfo(rule, snapshot) {
  const infos = mapBy(snapshot.infos, "id");
  const missing = rule.params.requiredInfoIds.filter((id) => infos.get(id)?.visible !== true);
  return missing.length === 0
    ? result(rule, "passed", "required visible information is present")
    : result(rule, failureStatus(rule), "required visible information is missing", { missing });
}

function checkInformationDensity(rule, snapshot) {
  const infos = mapBy(snapshot.infos, "id");
  const visibleForbidden = rule.params.hiddenUnlessExpanded.filter((id) => infos.get(id)?.visible === true);
  const failures = [];
  if (snapshot.items.length === 0) failures.push({ reason: "no items were captured" });
  for (const item of snapshot.items) {
    if (item.visibleTextLength < rule.params.minVisibleTextLengthPerItem || item.visibleTextLength > rule.params.maxVisibleTextLengthPerItem) {
      failures.push({ itemId: item.id, metric: "visibleTextLength", actual: item.visibleTextLength, minimum: rule.params.minVisibleTextLengthPerItem, maximum: rule.params.maxVisibleTextLengthPerItem });
    }
    if (item.primaryActionCount < rule.params.minPrimaryActionsPerItem || item.primaryActionCount > rule.params.maxPrimaryActionsPerItem) {
      failures.push({ itemId: item.id, metric: "primaryActionCount", actual: item.primaryActionCount, minimum: rule.params.minPrimaryActionsPerItem, maximum: rule.params.maxPrimaryActionsPerItem });
    }
  }
  if (visibleForbidden.length > 0 || failures.length > 0) {
    return result(rule, failureStatus(rule), "information density is outside the configured inclusive range", { visibleForbidden, failures });
  }
  return result(rule, "passed", "information density is inside the configured inclusive range");
}

function checkInformationOrder(rule, snapshot) {
  const infos = mapBy(snapshot.infos, "id");
  const metric = rule.params.orderMetric;
  const primary = rule.params.primaryInfoIds.map((id) => infos.get(id)).filter((item) => item?.visible).map((item) => item[metric]);
  const secondary = rule.params.secondaryInfoIds.map((id) => infos.get(id)).filter((item) => item?.visible).map((item) => item[metric]);
  if (primary.length !== rule.params.primaryInfoIds.length || secondary.length !== rule.params.secondaryInfoIds.length) {
    return result(rule, failureStatus(rule), "primary or secondary information was not captured as visible", { metric, primary, secondary });
  }
  const maxPrimary = Math.max(...primary);
  const minSecondary = Math.min(...secondary);
  return maxPrimary <= minSecondary
    ? result(rule, "passed", `primary information precedes secondary information by ${metric}`, { maxPrimary, minSecondary })
    : result(rule, failureStatus(rule), `secondary information precedes primary information by ${metric}`, { maxPrimary, minSecondary });
}

function checkProximity(rule, snapshot) {
  const elements = mapBy(snapshot.elements, "ref");
  const metric = rule.params.distanceMetric;
  const calculate = metric === "edgeGapPx" ? edgeGap : centerDistance;
  const failures = [];
  for (const pair of rule.params.relationPairs) {
    const target = elements.get(pair.targetRef);
    const action = elements.get(pair.actionRef);
    if (!target || !action || !target.visible || !action.visible) {
      failures.push({ pair, reason: "visible target or action was not captured" });
      continue;
    }
    const actual = calculate(target, action);
    if (actual > rule.params.maxDistancePx) failures.push({ pair, metric, actual, maximumInclusive: rule.params.maxDistancePx });
  }
  return failures.length === 0
    ? result(rule, "passed", `related actions satisfy ${metric} <= ${rule.params.maxDistancePx}`, { metric })
    : result(rule, failureStatus(rule), "related actions exceed the configured distance", { failures });
}

function checkConsistency(rule, snapshot) {
  const elements = mapBy(snapshot.elements, "ref");
  const failures = [];
  let compared = 0;
  for (const group of snapshot.consistencyGroups) {
    if (group.refs.length < rule.params.minimumComparedElements) {
      failures.push({ groupId: group.id, reason: "not enough elements to compare", actual: group.refs.length, minimum: rule.params.minimumComparedElements });
      continue;
    }
    for (const key of rule.params.compareBy) {
      if (!Object.hasOwn(group.expected, key)) failures.push({ groupId: group.id, key, reason: "expected value is missing" });
    }
    for (const ref of group.refs) {
      const element = elements.get(ref);
      if (!element) {
        failures.push({ groupId: group.id, ref, reason: "element was not captured" });
        continue;
      }
      compared += 1;
      for (const key of rule.params.compareBy) {
        if (Object.hasOwn(group.expected, key) && element[key] !== group.expected[key]) {
          failures.push({ groupId: group.id, ref, key, expected: group.expected[key], actual: element[key] });
        }
      }
    }
  }
  if (compared < rule.params.minimumComparedElements) failures.push({ reason: "comparison count is below minimum", compared, minimum: rule.params.minimumComparedElements });
  return failures.length === 0
    ? result(rule, "passed", "same-role UI patterns are consistent", { compared })
    : result(rule, failureStatus(rule), "same-role UI patterns are inconsistent", { compared, failures });
}

export function runDomChecks(profile, snapshot, evidenceSourceId) {
  const source = profile.evidenceSources.find((item) => item.id === evidenceSourceId);
  if (!source) throw new Error(`unknown evidence source: ${evidenceSourceId}`);
  const rules = profile.rules.filter((rule) => rule.evidenceSourceIds.includes(evidenceSourceId) && SUPPORTED_ASSERTIONS.has(rule.assertion));
  if (rules.length === 0) throw new Error(`evidence source ${evidenceSourceId} has no DOM-compatible rules`);
  return rules.map((rule) => {
    if (rule.assertion === "requiredInfoPresent") return checkRequiredInfo(rule, snapshot);
    if (rule.assertion === "hiddenUnlessExpanded") return checkInformationDensity(rule, snapshot);
    if (rule.assertion === "primaryBeforeSecondary") return checkInformationOrder(rule, snapshot);
    if (rule.assertion === "relatedActionsNearTarget") return checkProximity(rule, snapshot);
    return checkConsistency(rule, snapshot);
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const contracts = await loadContracts(defaultContractPaths(scriptDirectory));
  const profile = await readJsonFile(args.profile);
  const snapshot = await readJsonFile(args.snapshot);
  assertProfile(profile, contracts);
  assertJsonSchema(snapshot, contracts.snapshot, "DOM snapshot");
  const results = runDomChecks(profile, snapshot, args.evidenceSourceId);
  const hasFailure = results.some((item) => item.status === "failed");
  const payload = {
    schemaVersion: RESULT_VERSION,
    status: hasFailure ? "failed" : "ok",
    adapterId: "dom-snapshot-adapter",
    profileId: profile.profileId,
    evidenceSourceId: args.evidenceSourceId,
    checkedAt: new Date().toISOString(),
    producer: { command: "run-ui-dom-snapshot.mjs", version: RESULT_VERSION },
    inputIdentity: { profileSha256: await fileSha256(args.profile), artifactSha256: await fileSha256(args.snapshot) },
    results
  };
  assertJsonSchema(payload, contracts.adapterResult, "DOM adapter result");
  const output = `${JSON.stringify(payload, null, 2)}\n`;
  if (args.out) {
    await mkdir(path.dirname(args.out), { recursive: true });
    await writeFile(args.out, output, "utf8");
  } else process.stdout.write(output);
  process.exitCode = hasFailure ? 1 : 0;
}

if (path.resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 2;
  });
}
