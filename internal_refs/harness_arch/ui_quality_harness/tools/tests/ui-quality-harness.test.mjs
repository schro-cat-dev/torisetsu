import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { validateJsonSchema } from "../json-schema-validator.mjs";
import { assertAdapter, validateProfile } from "../profile-contract.mjs";
import { runDomChecks } from "../run-ui-dom-snapshot.mjs";
import { aggregateResults, classifyCommandOutcome, exitCodeForAggregateStatus, findFailedDependencies, runUiQualityHarness } from "../run-ui-quality-harness.mjs";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const harnessDirectory = path.resolve(testDirectory, "../..");
const repoRoot = path.resolve(harnessDirectory, "../../..");

const profileSchema = await readJson("contracts/ui-quality-profile.schema.json");
const snapshotSchema = await readJson("contracts/ui-dom-snapshot.schema.json");
const adapterSchema = await readJson("contracts/ui-tool-adapter.schema.json");
const aggregateSchema = await readJson("contracts/ui-quality-aggregate-result.schema.json");
const assertionCatalog = await readJson("contracts/ui-quality-assertions.contract.json");
const sampleProfile = await readJson("samples/collection-list.ui-quality-profile.json");
const sampleSnapshot = await readJson("fixtures/collection-list.dom-snapshot.json");

test("Schemaはunknown field、必須欠落、型違い、enum外、空配列を拒否する", () => {
  assertIssue(profileSchema, { ...sampleProfile, unexpected: true }, "$.unexpected");
  const missing = structuredClone(sampleProfile);
  delete missing.profileId;
  assertIssue(profileSchema, missing, "$.profileId");
  assertIssue(profileSchema, { ...sampleProfile, gates: "invalid" }, "$.gates");
  const enumOutside = structuredClone(sampleProfile);
  enumOutside.rules[0].checkKind = "sometimes";
  assertIssue(profileSchema, enumOutside, "$.rules[0].checkKind");
  assertIssue(profileSchema, { ...sampleProfile, gates: [] }, "$.gates");
  assertIssue(snapshotSchema, { ...sampleSnapshot, unexpected: true }, "$.unexpected");
});

test("assertion別paramsは空、負数、空配列、unknown keyを拒否する", () => {
  for (const params of [{}, { distanceMetric: "edgeGapPx", maxDistancePx: -1, relationPairs: [] }, { distanceMetric: "edgeGapPx", maxDistancePx: 10, relationPairs: [], unknown: true }]) {
    const profile = structuredClone(sampleProfile);
    profile.rules.find((rule) => rule.assertion === "relatedActionsNearTarget").params = params;
    assert.ok(validateProfile(profile, profileSchema, assertionCatalog).length > 0);
  }
});

test("evidence source IDを変更してもDOM判定は変わらない", () => {
  const profile = structuredClone(sampleProfile);
  profile.evidenceSources.find((source) => source.id === "domSnapshot").id = "renamed-dom-source";
  for (const rule of profile.rules) {
    rule.evidenceSourceIds = rule.evidenceSourceIds.map((id) => id === "domSnapshot" ? "renamed-dom-source" : id);
  }
  const original = runDomChecks(sampleProfile, sampleSnapshot, "domSnapshot").map(({ ruleId, status }) => ({ ruleId, status }));
  const renamed = runDomChecks(profile, sampleSnapshot, "renamed-dom-source").map(({ ruleId, status }) => ({ ruleId, status }));
  assert.deepEqual(renamed, original);
  assert.throws(() => runDomChecks(profile, sampleSnapshot, "missing-source"), /unknown evidence source/);
});

test("情報量のmin/maxはinclusiveで直前・同値・直後を判定する", () => {
  const rule = sampleProfile.rules.find((item) => item.assertion === "hiddenUnlessExpanded");
  const cases = [
    { value: rule.params.minVisibleTextLengthPerItem - 1, expected: "warning" },
    { value: rule.params.minVisibleTextLengthPerItem, expected: "passed" },
    { value: rule.params.maxVisibleTextLengthPerItem, expected: "passed" },
    { value: rule.params.maxVisibleTextLengthPerItem + 1, expected: "warning" }
  ];
  for (const item of cases) {
    const snapshot = structuredClone(sampleSnapshot);
    snapshot.items[0].visibleTextLength = item.value;
    const actual = runDomChecks(sampleProfile, snapshot, "domSnapshot").find((result) => result.ruleId === rule.id);
    assert.equal(actual.status, item.expected, `visibleTextLength=${item.value}`);
  }
});

test("距離はedge gapの上限直前・同値・直後を判定する", () => {
  const profile = structuredClone(sampleProfile);
  const rule = profile.rules.find((item) => item.assertion === "relatedActionsNearTarget");
  const target = sampleSnapshot.elements.find((item) => item.ref === "item.summary");
  const maximum = rule.params.maxDistancePx;
  for (const [actualGap, expected] of [[maximum - 1, "passed"], [maximum, "passed"], [maximum + 1, "warning"]]) {
    const snapshot = structuredClone(sampleSnapshot);
    const action = snapshot.elements.find((item) => item.ref === "item.editAction");
    action.boundingBox.x = target.boundingBox.x + target.boundingBox.width + actualGap;
    action.boundingBox.y = target.boundingBox.y;
    const actual = runDomChecks(profile, snapshot, "domSnapshot").find((item) => item.ruleId === rule.id);
    assert.equal(actual.status, expected, `edgeGapPx=${actualGap}`);
  }
});

test("同一役割比較は0件やexpected欠落を成功扱いしない", () => {
  const snapshot = structuredClone(sampleSnapshot);
  snapshot.consistencyGroups[0].refs = [];
  delete snapshot.consistencyGroups[0].expected.variant;
  const result = runDomChecks(sampleProfile, snapshot, "domSnapshot").find((item) => item.ruleId === "same-role-same-pattern");
  assert.equal(result.status, "warning");
  assert.ok(result.evidence.failures.length > 0);
});

test("最終集約はmissing、skip、scenario未実行を失敗にする", () => {
  const profile = minimalProfile();
  const noRulesProfile = { ...profile, rules: [] };
  const noRules = aggregateResults(noRulesProfile, "hash", [], [], assertionCatalog);
  assert.equal(noRules.status, "failed");
  assert.equal(exitCodeForAggregateStatus(noRules.status), 1);
  const missing = aggregateResults(profile, "hash", [], [], assertionCatalog);
  assert.equal(missing.status, "failed");
  assert.equal(exitCodeForAggregateStatus(missing.status), 1);
  const skippedAdapter = minimalAdapterResult("skipped", []);
  const skipped = aggregateResults(profile, "hash", [skippedAdapter], [{ id: "source", status: "ok" }], assertionCatalog);
  assert.equal(skipped.status, "failed");
  assert.equal(exitCodeForAggregateStatus(skipped.status), 1);
  const noScenario = aggregateResults(profile, "hash", [minimalAdapterResult("passed", [])], [{ id: "source", status: "ok" }], assertionCatalog);
  assert.equal(noScenario.status, "failed");
  assert.equal(exitCodeForAggregateStatus(noScenario.status), 1);
  const blockingWarning = aggregateResults(profile, "hash", [minimalAdapterResult("warning", ["flow"])], [{ id: "source", status: "ok" }], assertionCatalog);
  assert.equal(blockingWarning.status, "failed");
  assert.equal(exitCodeForAggregateStatus(blockingWarning.status), 1);
  const passed = aggregateResults(profile, "hash", [minimalAdapterResult("passed", ["flow"])], [{ id: "source", status: "ok" }], assertionCatalog);
  assert.equal(passed.status, "ok");
  assert.equal(exitCodeForAggregateStatus(passed.status), 0);
});

test("visual thresholdは0.009/0.010を許可し0.011を拒否する", async () => {
  const policy = await readJson("project_profiles/todo_frontend/todo-visual-threshold.policy.json");
  assert.deepEqual(policy.boundaryCases.map((item) => item.actual <= policy.maxDiffPixelRatio ? "passed" : "failed"), policy.boundaryCases.map((item) => item.expected));
});

test("orchestratorはroot外pathを拒否する", async () => {
  await assert.rejects(() => runUiQualityHarness({ root: repoRoot, profile: "../outside.json" }), /must stay inside/);
});

test("adapter schemaは旧command形とunknown fieldを拒否する", () => {
  const adapter = {
    schemaVersion: "ui-quality-tool-adapter.v1",
    adapterId: "a",
    adapterKind: "test",
    capabilities: ["x"],
    execution: { mode: "external_command", command: {} },
    inputContract: { profileRuleIds: ["r"], profileScenarioIds: [], claims: [] },
    outputContract: { resultMode: "command_status" }
  };
  assert.ok(validateJsonSchema(adapter, adapterSchema).length > 0);
});

test("adapter契約はresult modeとcommand依存順を検証する", () => {
  const adapter = {
    schemaVersion: "ui-quality-tool-adapter.v1",
    adapterId: "adapter",
    adapterKind: "test",
    capabilities: ["check"],
    execution: {
      mode: "external_command",
      commands: [
        { id: "first", executable: "node", args: [], workingDirectoryRef: ".", timeoutSeconds: 1 },
        { id: "second", executable: "node", args: [], workingDirectoryRef: ".", timeoutSeconds: 1, requires: ["first"] }
      ]
    },
    inputContract: { profileRuleIds: ["rule"], profileScenarioIds: [], claims: [] },
    outputContract: { resultMode: "command_status" }
  };
  assert.doesNotThrow(() => assertAdapter(adapter, { adapter: adapterSchema }));
  const forwardReference = structuredClone(adapter);
  forwardReference.execution.commands[0].requires = ["second"];
  assert.throws(() => assertAdapter(forwardReference, { adapter: adapterSchema }), /earlier command/);
  const missingResultFile = structuredClone(adapter);
  missingResultFile.outputContract.resultMode = "result_file";
  assert.throws(() => assertAdapter(missingResultFile, { adapter: adapterSchema }), /requires outputContract.resultFile/);
});

test("command結果は成功、失敗、timeout、依存失敗を区別する", () => {
  assert.equal(classifyCommandOutcome({ timedOut: false, exitCode: 0 }), "passed");
  assert.equal(classifyCommandOutcome({ timedOut: false, exitCode: 3 }), "command_failed");
  assert.equal(classifyCommandOutcome({ timedOut: true, exitCode: 124 }), "timed_out");
  assert.deepEqual(findFailedDependencies({ requires: ["first", "missing"] }, [{ id: "first", outcome: "command_failed" }]), ["first", "missing"]);
});

test("aggregate result schemaは入れ子のunknown fieldも拒否する", () => {
  const profile = minimalProfile();
  const aggregate = aggregateResults(profile, "hash", [minimalAdapterResult("passed", ["flow"])], [{
    id: "source",
    adapterId: "adapter",
    status: "ok",
    resultPath: ".ui-quality-runs/source.json",
    commands: [{ id: "check", commandText: "node check.mjs", exitCode: 0, timedOut: false, outcome: "passed", failedDependencies: [] }]
  }], assertionCatalog);
  assert.deepEqual(validateJsonSchema(aggregate, aggregateSchema), []);
  aggregate.gates[0].unexpected = true;
  assertIssue(aggregateSchema, aggregate, "$.gates[0].unexpected");
});

test("外部tool runnerは失敗後にfileをrestoreしroot外pathを拒否する", async (context) => {
  const appRoot = path.resolve(repoRoot, "harness_lab/todo_frontend");
  const parent = path.join(appRoot, ".ui-quality-runs");
  await mkdir(parent, { recursive: true });
  const temporaryDirectory = await mkdtemp(path.join(parent, "runner-test-"));
  context.after(() => rm(temporaryDirectory, { recursive: true, force: true }));
  const relativeDirectory = path.relative(appRoot, temporaryDirectory);
  const restorePath = path.join(relativeDirectory, "restore.txt");
  const specPath = path.join(temporaryDirectory, "failure.tool.json");
  await writeFile(path.join(appRoot, restorePath), "original\n", "utf8");
  await writeFile(specPath, JSON.stringify({
    schemaVersion: "external-tool-check.v1",
    name: "restore-on-failure",
    tool: "node",
    preflightFiles: [restorePath],
    restoreFiles: [restorePath],
    command: {
      bin: "node",
      args: ["-e", `require('node:fs').writeFileSync(${JSON.stringify(path.join(appRoot, restorePath))}, 'changed\\n'); process.exit(3)`]
    },
    result: { fileName: "failure-result.json" }
  }), "utf8");
  const runner = "tooling/quality-harness/checks/run-external-tool-spec.mjs";
  const failed = spawnSync(process.execPath, [runner, path.relative(appRoot, specPath)], { cwd: appRoot, encoding: "utf8", env: { ...process.env, HARNESS_RUN_DIR: temporaryDirectory } });
  assert.equal(failed.status, 3);
  assert.equal(await readFile(path.join(appRoot, restorePath), "utf8"), "original\n");

  const traversalPath = path.join(temporaryDirectory, "traversal.tool.json");
  await writeFile(traversalPath, JSON.stringify({
    schemaVersion: "external-tool-check.v1",
    name: "traversal",
    tool: "node",
    preflightFiles: ["../outside"],
    restoreFiles: [],
    command: { bin: "node", args: ["-e", "process.exit(0)"] },
    result: { fileName: "traversal-result.json" }
  }), "utf8");
  const traversal = spawnSync(process.execPath, [runner, path.relative(appRoot, traversalPath)], { cwd: appRoot, encoding: "utf8" });
  assert.notEqual(traversal.status, 0);
  assert.match(`${traversal.stdout}${traversal.stderr}`, /must stay inside/);
});

function minimalProfile() {
  return {
    profileId: "minimal-profile",
    gates: [{ id: "gate", blocking: true }],
    rules: [{ id: "rule", gateId: "gate", assertion: "flowScenarioCompletes", evidenceSourceIds: ["source"], scenarioIds: ["flow"], params: { expectedCompletionState: "done" } }],
    scenarios: [{ id: "flow" }]
  };
}

function minimalAdapterResult(status, scenarioIds) {
  return {
    evidenceSourceId: "source",
    results: [{ ruleId: "rule", gateId: "gate", status, claims: ["done"], scenarioIds, evidence: {}, message: "test" }]
  };
}

function assertIssue(schema, value, expectedPath) {
  const issues = validateJsonSchema(value, schema);
  assert.ok(issues.some((issue) => issue.path === expectedPath), JSON.stringify(issues));
}

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.resolve(harnessDirectory, relativePath), "utf8"));
}
