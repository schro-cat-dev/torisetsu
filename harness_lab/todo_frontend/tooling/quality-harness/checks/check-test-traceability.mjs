import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const manifestPath = process.argv[2];

if (!manifestPath) {
  throw new Error("Usage: <test-traceability-runner> <manifest.json>");
}
const manifest = await readJson(join(root, manifestPath));
const context = { root, manifestPath };

validateManifest(manifest);
await validateTraceabilityFiles(manifest);
const results = await runSpecs(manifest, context);
const resultPath = await writeResult(results);

console.log(`Test traceability OK: ${manifest.cases.length} cases`);
console.log(`Test traceability result: ${resultPath}`);

async function validateTraceabilityFiles(manifestToValidate) {
  const specDir = join(root, manifestToValidate.specDir);
  const expectedStems = new Set(manifestToValidate.cases.map((testCase) => testCase.theme));
  const specFiles = await listFiles(specDir, ".json");
  const sourceMap = new Map(manifestToValidate.requirementSources.map((source) => [source.id, source]));

  assertSameFileSet("specs", specFiles, expectedStems, ".json");
  await validateRequirementSources(manifestToValidate, sourceMap);

  for (const testCase of manifestToValidate.cases) {
    const specPath = join(root, manifestToValidate.specDir, `${testCase.theme}.json`);
    const spec = await readJson(specPath);

    assert(spec.schemaVersion === "test-spec.v1", `${testCase.theme}: schemaVersion must be test-spec.v1.`);
    assert(spec.theme === testCase.theme, `${testCase.theme}: spec.theme must match manifest theme.`);
    assertSameRequirementRef(testCase, spec);
    assert(spec.tester && typeof spec.tester === "string", `${testCase.theme}: tester is required.`);
    assert(Array.isArray(spec.links), `${testCase.theme}: links must be an array.`);

    await assertFileExists(specPath, `${testCase.theme}: spec file missing.`);

    for (const link of spec.links) {
      assert(link.path && typeof link.path === "string", `${testCase.theme}: link.path is required.`);
      await assertFileExists(join(root, link.path), `${testCase.theme}: linked file missing: ${link.path}`);
    }
  }
}

async function validateRequirementSources(manifestToValidate, sourceMap) {
  const expectedKeysBySource = new Map();

  for (const testCase of manifestToValidate.cases) {
    const requirement = testCase.requirement;
    const source = sourceMap.get(requirement.sourceId);
    assert(source, `${testCase.theme}: unknown requirement source ${requirement.sourceId}`);

    const keys = expectedKeysBySource.get(source.id) ?? new Set();
    keys.add(requirement.key);
    expectedKeysBySource.set(source.id, keys);

    await validateRequirementArtifact(testCase.theme, source, requirement.key);
  }

  for (const source of manifestToValidate.requirementSources) {
    const expectedKeys = expectedKeysBySource.get(source.id) ?? new Set();
    const files = await listFiles(join(root, source.dir), source.extension);
    assertSameFileSet(`requirement source ${source.id}`, files, expectedKeys, source.extension);
  }
}

async function validateRequirementArtifact(theme, source, key) {
  const artifactPath = join(root, source.dir, `${key}${source.extension}`);
  await assertFileExists(artifactPath, `${theme}: requirement artifact missing: ${normalizePath(source.dir, `${key}${source.extension}`)}`);

  if (source.type === "issue-file") {
    const issue = await readJson(artifactPath);
    assert(issue.schemaVersion === "requirement-source.issue-file.v1", `${theme}: issue-file schemaVersion is invalid.`);
    assert(issue.theme === theme, `${theme}: issue-file theme must match manifest theme.`);
    assert(issue.issue && typeof issue.issue.id === "string", `${theme}: issue-file issue.id is required.`);
  }

  if (source.type === "github-issue-fixture") {
    const issue = await readJson(artifactPath);
    assert(issue.schemaVersion === "requirement-source.github-issue-fixture.v1", `${theme}: github issue fixture schemaVersion is invalid.`);
    assert(issue.theme === theme, `${theme}: github issue fixture theme must match manifest theme.`);
    assert(issue.github && typeof issue.github.owner === "string", `${theme}: github.owner is required.`);
    assert(issue.github && typeof issue.github.repo === "string", `${theme}: github.repo is required.`);
    assert(issue.github && typeof issue.github.number === "number", `${theme}: github.number is required.`);
  }
}

async function runSpecs(manifestToRun, contextToUse) {
  const results = [];

  for (const testCase of manifestToRun.cases) {
    const specPath = join(root, manifestToRun.specDir, `${testCase.theme}.json`);
    const spec = await readJson(specPath);
    const modulePath = join(root, manifestToRun.testerModuleDir, `${spec.tester}.mjs`);
    const tester = await import(pathToFileURL(modulePath));

    validateTesterModule(testCase.theme, spec.tester, tester);
    tester.validateInput(spec.input, testCase.theme);

    if (typeof tester.run !== "function") {
      throw new Error(`${testCase.theme}: tester ${spec.tester} must export run().`);
    }

    const result = await tester.run({ spec, context: contextToUse });
    const assertionCount = result?.assertionCount ?? 0;
    assert(assertionCount > 0, `${testCase.theme}: tester must report at least one assertion.`);
    results.push({
      theme: testCase.theme,
      title: testCase.title,
      requirementRef: spec.requirementRef,
      tester: spec.tester,
      assertionCount,
      status: "ok"
    });
  }

  return results;
}

function validateManifest(manifestToValidate) {
  assert(manifestToValidate.schemaVersion === "test-manifest.v2", "manifest.schemaVersion must be test-manifest.v2.");
  assert(typeof manifestToValidate.specDir === "string" && manifestToValidate.specDir, "manifest.specDir is required.");
  assert(typeof manifestToValidate.testerModuleDir === "string" && manifestToValidate.testerModuleDir, "manifest.testerModuleDir is required.");
  assert(Array.isArray(manifestToValidate.requirementSources) && manifestToValidate.requirementSources.length > 0, "manifest.requirementSources must be a non-empty array.");
  assert(Array.isArray(manifestToValidate.cases) && manifestToValidate.cases.length > 0, "manifest.cases must be a non-empty array.");

  validateRequirementSourceDefinitions(manifestToValidate.requirementSources);

  const seen = new Set();
  for (const testCase of manifestToValidate.cases) {
    assert(/^[a-z0-9-]+$/.test(testCase.theme), `Invalid theme: ${testCase.theme}`);
    assert(!seen.has(testCase.theme), `Duplicate theme: ${testCase.theme}`);
    assert(testCase.requirement && typeof testCase.requirement.sourceId === "string", `${testCase.theme}: requirement.sourceId is required.`);
    assert(testCase.requirement && typeof testCase.requirement.key === "string", `${testCase.theme}: requirement.key is required.`);
    assert(testCase.requirement.key === testCase.theme, `${testCase.theme}: requirement.key must match theme.`);
    seen.add(testCase.theme);
  }
}

function validateRequirementSourceDefinitions(sources) {
  const seen = new Set();
  const supportedTypes = new Set(["md", "issue-file", "github-issue-fixture"]);

  for (const source of sources) {
    assert(source.id && typeof source.id === "string", "requirementSources[].id is required.");
    assert(!seen.has(source.id), `Duplicate requirement source: ${source.id}`);
    assert(supportedTypes.has(source.type), `${source.id}: unsupported requirement source type ${source.type}`);
    assert(source.dir && typeof source.dir === "string", `${source.id}: dir is required.`);
    assert(source.extension && source.extension.startsWith("."), `${source.id}: extension must start with ".".`);
    seen.add(source.id);
  }
}

function assertSameRequirementRef(testCase, spec) {
  assert(spec.requirementRef, `${testCase.theme}: requirementRef is required.`);
  assert(spec.requirementRef.sourceId === testCase.requirement.sourceId, `${testCase.theme}: requirementRef.sourceId must match manifest.`);
  assert(spec.requirementRef.key === testCase.requirement.key, `${testCase.theme}: requirementRef.key must match manifest.`);
}

function validateTesterModule(theme, testerName, tester) {
  assert(tester.metadata && typeof tester.metadata === "object", `${theme}: tester ${testerName} must export metadata.`);
  assert(tester.metadata.schemaVersion === "tester-module.v1", `${theme}: tester ${testerName} metadata.schemaVersion must be tester-module.v1.`);
  assert(tester.metadata.name === testerName, `${theme}: tester metadata.name must be ${testerName}.`);
  assert(typeof tester.validateInput === "function", `${theme}: tester ${testerName} must export validateInput().`);
}

async function writeResult(results) {
  const outputDir = process.env.HARNESS_RUN_DIR ?? join(root, "harness_runs", "manual");
  await mkdir(outputDir, { recursive: true });
  const resultPath = join(outputDir, "test-traceability.results.json");
  const payload = {
    schemaVersion: "test-traceability-result.v1",
    manifestPath,
    generatedAt: new Date().toISOString(),
    caseCount: results.length,
    assertionCount: results.reduce((sum, result) => sum + result.assertionCount, 0),
    results
  };
  await writeFile(resultPath, `${JSON.stringify(payload, null, 2)}\n`);
  return resultPath;
}

async function listFiles(dir, extension) {
  const entries = await readdir(dir, { withFileTypes: true });
  return entries.filter((entry) => entry.isFile() && extname(entry.name) === extension).map((entry) => entry.name).sort();
}

function assertSameFileSet(label, files, expectedStems, extension) {
  const actualStems = new Set(files.map((file) => basename(file, extension)));

  for (const expectedStem of expectedStems) {
    assert(actualStems.has(expectedStem), `${label}: missing ${expectedStem}${extension}`);
  }

  for (const actualStem of actualStems) {
    assert(expectedStems.has(actualStem), `${label}: unexpected ${actualStem}${extension}`);
  }
}

async function assertFileExists(path, message) {
  try {
    await readFile(path, "utf8");
  } catch {
    throw new Error(message);
  }
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

function normalizePath(...parts) {
  return parts.join("/");
}

function assert(value, message) {
  if (!value) {
    throw new Error(message);
  }
}
