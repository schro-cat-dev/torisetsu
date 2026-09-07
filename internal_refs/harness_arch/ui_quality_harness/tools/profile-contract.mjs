import path from "node:path";
import { assertJsonSchema, readJsonFile, validateJsonSchema } from "./json-schema-validator.mjs";

export function defaultContractPaths(toolDirectory) {
  const contractDirectory = path.resolve(toolDirectory, "../contracts");
  return {
    profile: path.join(contractDirectory, "ui-quality-profile.schema.json"),
    profileResult: path.join(contractDirectory, "ui-quality-result.schema.json"),
    adapter: path.join(contractDirectory, "ui-tool-adapter.schema.json"),
    adapterResult: path.join(contractDirectory, "ui-quality-adapter-result.schema.json"),
    snapshot: path.join(contractDirectory, "ui-dom-snapshot.schema.json"),
    review: path.join(contractDirectory, "ui-judgment-review.schema.json"),
    aggregateResult: path.join(contractDirectory, "ui-quality-aggregate-result.schema.json"),
    assertionCatalog: path.join(contractDirectory, "ui-quality-assertions.contract.json")
  };
}

export async function loadContracts(paths) {
  const entries = await Promise.all(Object.entries(paths).map(async ([key, filePath]) => [key, await readJsonFile(filePath)]));
  return Object.fromEntries(entries);
}

export function validateProfile(profile, profileSchema, assertionCatalog) {
  const issues = validateJsonSchema(profile, profileSchema);
  if (issues.length > 0) return issues;

  if (assertionCatalog?.schemaVersion !== "ui-quality-assertion-catalog.v1") {
    return [{ path: "$.contracts.assertionCatalog", message: "assertion catalog version is invalid" }];
  }

  const gateIds = collectUniqueIds(profile.gates, "$.gates", issues);
  const sourceIds = collectUniqueIds(profile.evidenceSources, "$.evidenceSources", issues);
  const scenarioIds = collectUniqueIds(profile.scenarios, "$.scenarios", issues);
  const rubricIds = collectUniqueIds(profile.reviewRubric, "$.reviewRubric", issues);
  collectUniqueIds(profile.rules, "$.rules", issues);

  for (const gateId of profile.qualityModel.requiredGateIds) {
    if (!gateIds.has(gateId)) issues.push({ path: "$.qualityModel.requiredGateIds", message: `required gate is missing: ${gateId}` });
  }

  for (const [index, rule] of profile.rules.entries()) {
    const rulePath = `$.rules[${index}]`;
    if (!gateIds.has(rule.gateId)) issues.push({ path: `${rulePath}.gateId`, message: `unknown gateId: ${rule.gateId}` });
    const contract = assertionCatalog.assertions?.[rule.assertion];
    if (!contract) {
      issues.push({ path: `${rulePath}.assertion`, message: `unknown assertion: ${rule.assertion}` });
    } else {
      for (const issue of validateJsonSchema(rule.params, contract.paramsSchema, `${rulePath}.params`)) issues.push(issue);
      validateParamRanges(rule, rulePath, issues);
    }
    for (const sourceId of rule.evidenceSourceIds) {
      if (!sourceIds.has(sourceId)) issues.push({ path: `${rulePath}.evidenceSourceIds`, message: `unknown evidence source: ${sourceId}` });
    }
    for (const scenarioId of rule.scenarioIds ?? []) {
      if (!scenarioIds.has(scenarioId)) issues.push({ path: `${rulePath}.scenarioIds`, message: `unknown scenario: ${scenarioId}` });
    }
    if (rule.checkKind === "judgment" && !rubricIds.has(rule.id)) {
      issues.push({ path: rulePath, message: "judgment rule requires a reviewRubric with the same id" });
    }
  }

  for (const [index, rubric] of profile.reviewRubric.entries()) {
    if (!gateIds.has(rubric.gateId)) issues.push({ path: `$.reviewRubric[${index}].gateId`, message: `unknown gateId: ${rubric.gateId}` });
  }
  return issues;
}

export function assertProfile(profile, contracts, label = "profile") {
  const issues = validateProfile(profile, contracts.profile, contracts.assertionCatalog);
  if (issues.length > 0) {
    throw new Error(`${label} is invalid:\n${issues.map((issue) => `${issue.path}: ${issue.message}`).join("\n")}`);
  }
}

export function assertAdapter(adapter, contracts, label = "adapter") {
  assertJsonSchema(adapter, contracts.adapter, label);
  const priorCommandIds = new Set();
  for (const [index, command] of adapter.execution.commands.entries()) {
    if (priorCommandIds.has(command.id)) throw new Error(`${label} has duplicate command id: ${command.id}`);
    for (const requiredId of command.requires ?? []) {
      if (!priorCommandIds.has(requiredId)) {
        throw new Error(`${label} $.execution.commands[${index}].requires must reference an earlier command: ${requiredId}`);
      }
    }
    priorCommandIds.add(command.id);
  }
  if (adapter.outputContract.resultMode === "result_file" && !adapter.outputContract.resultFile) {
    throw new Error(`${label} result_file mode requires outputContract.resultFile`);
  }
  if (adapter.outputContract.resultMode === "command_status" && adapter.outputContract.resultFile) {
    throw new Error(`${label} command_status mode must not define outputContract.resultFile`);
  }
}

function collectUniqueIds(items, itemPath, issues) {
  const ids = new Set();
  items.forEach((item, index) => {
    if (ids.has(item.id)) issues.push({ path: `${itemPath}[${index}].id`, message: `duplicate id: ${item.id}` });
    ids.add(item.id);
  });
  return ids;
}

function validateParamRanges(rule, rulePath, issues) {
  const params = rule.params;
  if (rule.assertion === "hiddenUnlessExpanded") {
    if (params.minVisibleTextLengthPerItem > params.maxVisibleTextLengthPerItem) {
      issues.push({ path: `${rulePath}.params`, message: "minVisibleTextLengthPerItem must be <= maxVisibleTextLengthPerItem" });
    }
    if (params.minPrimaryActionsPerItem > params.maxPrimaryActionsPerItem) {
      issues.push({ path: `${rulePath}.params`, message: "minPrimaryActionsPerItem must be <= maxPrimaryActionsPerItem" });
    }
  }
}
