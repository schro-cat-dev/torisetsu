#!/usr/bin/env node
import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fileSha256 } from "./artifact-identity.mjs";
import { assertJsonSchema, readJsonFile } from "./json-schema-validator.mjs";
import { assertProfile, defaultContractPaths, loadContracts } from "./profile-contract.mjs";

const RESULT_VERSION = "ui-quality-adapter-result.v1";
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    const value = argv[index + 1];
    if (["--profile", "--review", "--evidence-source-id", "--out"].includes(key)) {
      if (!value || value.startsWith("--")) throw new Error(`${key} requires a value`);
      args[key === "--evidence-source-id" ? "evidenceSourceId" : key.slice(2)] = value;
      index += 1;
      continue;
    }
    throw new Error(`unknown argument: ${key}`);
  }
  if (!args.profile || !args.review || !args.evidenceSourceId) {
    throw new Error("--profile, --review, and --evidence-source-id are required");
  }
  return args;
}

function itemResult(rule, status, message, evidence = {}) {
  return { ruleId: rule.id, gateId: rule.gateId, status, message, evidence, scenarioIds: rule.scenarioIds ?? [], claims: [] };
}

async function validateReview(profile, review, reviewPath, evidenceSourceId) {
  if (review.profileId !== profile.profileId) throw new Error("review profileId must match profile profileId");
  const source = profile.evidenceSources.find((item) => item.id === evidenceSourceId);
  if (!source) throw new Error(`unknown evidence source: ${evidenceSourceId}`);
  const rules = profile.rules.filter((rule) => rule.assertion === "judgmentReview" && rule.evidenceSourceIds.includes(evidenceSourceId));
  if (rules.length === 0) throw new Error(`evidence source ${evidenceSourceId} has no judgment rules`);

  const rubricById = new Map(profile.reviewRubric.map((rubric) => [rubric.id, rubric]));
  const itemById = new Map();
  for (const item of review.items) {
    if (itemById.has(item.rubricId)) throw new Error(`duplicate review item: ${item.rubricId}`);
    itemById.set(item.rubricId, item);
  }
  const artifactById = new Map();
  for (const artifact of review.evidenceArtifacts) {
    if (artifactById.has(artifact.id)) throw new Error(`duplicate evidence artifact: ${artifact.id}`);
    artifactById.set(artifact.id, artifact);
    if (artifact.kind === "file") await assertEvidenceFile(reviewPath, artifact.artifactRef);
    if (artifact.kind === "observation" && artifact.artifactRef.trim().length < 20) {
      throw new Error(`observation evidence must contain a concrete statement: ${artifact.id}`);
    }
  }

  return rules.map((rule) => {
    const rubric = rubricById.get(rule.id);
    const item = itemById.get(rule.id);
    if (!rubric || !item) return itemResult(rule, "failed", "judgment rule has no completed review item");
    const missing = rubric.requiredEvidence.filter((id) => !item.evidence.includes(id) || !artifactById.has(id));
    if (missing.length > 0) return itemResult(rule, "failed", "judgment evidence is missing", { missing });
    if (!item.rationale.trim()) return itemResult(rule, "failed", "judgment rationale is empty");
    if (item.status === "failed") return itemResult(rule, "failed", "judgment review failed", { rationale: item.rationale, evidenceIds: item.evidence });
    if (item.status === "needs_revision") return itemResult(rule, "warning", "judgment review needs revision", { rationale: item.rationale, evidenceIds: item.evidence, openQuestions: item.openQuestions });
    return itemResult(rule, "passed", "judgment review passed with verified evidence references", { rationale: item.rationale, evidenceIds: item.evidence });
  });
}

async function assertEvidenceFile(reviewPath, artifactRef) {
  const reviewDirectory = path.dirname(path.resolve(reviewPath));
  const resolved = path.resolve(reviewDirectory, artifactRef);
  if (resolved !== reviewDirectory && !resolved.startsWith(`${reviewDirectory}${path.sep}`)) {
    throw new Error(`evidence artifact must stay inside the review directory: ${artifactRef}`);
  }
  try {
    await access(resolved);
  } catch {
    throw new Error(`evidence artifact was not found: ${artifactRef}`);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const contracts = await loadContracts(defaultContractPaths(scriptDirectory));
  const profile = await readJsonFile(args.profile);
  const review = await readJsonFile(args.review);
  assertProfile(profile, contracts);
  assertJsonSchema(review, contracts.review, "judgment review");
  const results = await validateReview(profile, review, args.review, args.evidenceSourceId);
  const hasFailure = results.some((item) => item.status === "failed");
  const payload = {
    schemaVersion: RESULT_VERSION,
    status: hasFailure ? "failed" : "ok",
    adapterId: "judgment-review-adapter",
    profileId: profile.profileId,
    evidenceSourceId: args.evidenceSourceId,
    checkedAt: new Date().toISOString(),
    producer: { command: "run-ui-judgment-review.mjs", version: RESULT_VERSION },
    inputIdentity: { profileSha256: await fileSha256(args.profile), artifactSha256: await fileSha256(args.review) },
    results
  };
  assertJsonSchema(payload, contracts.adapterResult, "judgment adapter result");
  const output = `${JSON.stringify(payload, null, 2)}\n`;
  if (args.out) {
    await mkdir(path.dirname(args.out), { recursive: true });
    await writeFile(args.out, output, "utf8");
  } else process.stdout.write(output);
  process.exitCode = hasFailure ? 1 : 0;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 2;
});
