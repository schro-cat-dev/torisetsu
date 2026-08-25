import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const contractPath = process.argv[2];
const outputDir = process.env.HARNESS_RUN_DIR;

if (!contractPath) {
  throw new Error("Usage: <ai-review-result-checker> <contract.json>");
}

const contract = JSON.parse(await readFile(join(root, contractPath), "utf8"));
validateContract(contract);

const sampleResults = [];

for (const sample of contract.samples) {
  const payload = JSON.parse(await readFile(join(root, sample.inputFile), "utf8"));
  const result = validateAndFilterSample(sample, payload);
  sampleResults.push(result);
}

await writeResult(sampleResults);

console.log(`AI review result gate OK: ${contract.samples.length} samples`);

function validateAndFilterSample(sample, payload) {
  validatePayload(sample.name, payload);

  const ranked = payload.reviews.map((review, index) => ({
    review,
    index,
    dropReasons: getDropReasons(review)
  }));

  const candidates = ranked
    .filter((item) => item.dropReasons.length === 0)
    .sort((left, right) => right.review.confidence - left.review.confidence);

  const kept = candidates.slice(0, contract.filters.maxReviews);
  const keptIndexes = new Set(kept.map((item) => item.index));
  const dropped = ranked.filter((item) => !keptIndexes.has(item.index)).map((item) => {
    if (item.dropReasons.length > 0) return item;
    return { ...item, dropReasons: ["maxReviews"] };
  });

  const result = {
    name: sample.name,
    inputFile: sample.inputFile,
    inputReviewCount: payload.reviews.length,
    keptReviewCount: kept.length,
    droppedReviewCount: dropped.length,
    keptReviews: kept.map((item) => item.review),
    droppedReviews: dropped.map((item) => ({
      policy_id: item.review.policy_id,
      severity: item.review.severity,
      confidence: item.review.confidence,
      reasons: item.dropReasons
    }))
  };

  assertExpected(sample, result);
  return result;
}

function validatePayload(sampleName, payload) {
  assert(payload && typeof payload === "object" && !Array.isArray(payload), `${sampleName}: payload must be an object.`);
  assert(Array.isArray(payload.reviews), `${sampleName}: reviews must be an array.`);
  assert(Object.keys(payload).every((key) => key === "reviews"), `${sampleName}: root field other than reviews is not allowed.`);

  for (const [index, review] of payload.reviews.entries()) {
    validateReview(sampleName, index, review);
  }
}

function validateReview(sampleName, index, review) {
  assert(review && typeof review === "object" && !Array.isArray(review), `${sampleName}: reviews[${index}] must be an object.`);

  const required = new Set(contract.reviewSchema.requiredFields);
  for (const field of required) {
    assert(Object.hasOwn(review, field), `${sampleName}: reviews[${index}].${field} is required.`);
  }

  if (contract.reviewSchema.allowUnknownFields === false) {
    for (const field of Object.keys(review)) {
      assert(required.has(field), `${sampleName}: reviews[${index}].${field} is not allowed.`);
    }
  }

  assert(typeof review.file === "string" && review.file.trim(), `${sampleName}: reviews[${index}].file must be a non-empty string.`);
  assert(Number.isInteger(review.line) && review.line >= 1, `${sampleName}: reviews[${index}].line must be an integer >= 1.`);
  assert(contract.reviewSchema.allowedSeverities.includes(review.severity), `${sampleName}: reviews[${index}].severity is invalid.`);
  assert(typeof review.policy_id === "string" && review.policy_id.trim(), `${sampleName}: reviews[${index}].policy_id must be a non-empty string.`);
  assert(typeof review.message === "string" && review.message.trim(), `${sampleName}: reviews[${index}].message must be a non-empty string.`);
  assert(typeof review.suggestion === "string" && review.suggestion.trim(), `${sampleName}: reviews[${index}].suggestion must be a non-empty string.`);
  assert(typeof review.confidence === "number" && review.confidence >= 0 && review.confidence <= 1, `${sampleName}: reviews[${index}].confidence must be 0..1.`);
}

function getDropReasons(review) {
  const reasons = [];

  if (review.confidence < contract.filters.minConfidenceInclusive) {
    reasons.push("confidence");
  }
  if (contract.filters.dropSeverities.includes(review.severity)) {
    reasons.push("severity");
  }

  return reasons;
}

function assertExpected(sample, result) {
  if (!sample.expected) return;

  assert(result.inputReviewCount === sample.expected.inputReviewCount, `${sample.name}: inputReviewCount mismatch.`);
  assert(result.keptReviewCount === sample.expected.keptReviewCount, `${sample.name}: keptReviewCount mismatch.`);
  assert(result.droppedReviewCount === sample.expected.droppedReviewCount, `${sample.name}: droppedReviewCount mismatch.`);
}

async function writeResult(sampleResultsToWrite) {
  if (!outputDir) return;

  await mkdir(outputDir, { recursive: true });
  const payload = {
    schemaVersion: "ai-review-result-gate-result.v1",
    generatedAt: new Date().toISOString(),
    name: contract.name,
    contractPath,
    filters: contract.filters,
    sampleCount: sampleResultsToWrite.length,
    samples: sampleResultsToWrite
  };
  await writeFile(join(outputDir, contract.result.fileName), `${JSON.stringify(payload, null, 2)}\n`);
}

function validateContract(contractToValidate) {
  assert(contractToValidate.schemaVersion === "ai-review-result-contract.v1", "contract.schemaVersion must be ai-review-result-contract.v1.");
  assert(typeof contractToValidate.name === "string" && contractToValidate.name, "contract.name is required.");
  assert(Array.isArray(contractToValidate.samples) && contractToValidate.samples.length > 0, "contract.samples must be a non-empty array.");
  assert(contractToValidate.reviewSchema && typeof contractToValidate.reviewSchema === "object", "contract.reviewSchema is required.");
  assert(Array.isArray(contractToValidate.reviewSchema.requiredFields), "contract.reviewSchema.requiredFields must be an array.");
  assert(Array.isArray(contractToValidate.reviewSchema.allowedSeverities), "contract.reviewSchema.allowedSeverities must be an array.");
  assert(contractToValidate.filters && typeof contractToValidate.filters === "object", "contract.filters is required.");
  assert(typeof contractToValidate.filters.minConfidenceInclusive === "number", "contract.filters.minConfidenceInclusive is required.");
  assert(Array.isArray(contractToValidate.filters.dropSeverities), "contract.filters.dropSeverities must be an array.");
  assert(Number.isInteger(contractToValidate.filters.maxReviews) && contractToValidate.filters.maxReviews >= 1, "contract.filters.maxReviews must be an integer >= 1.");
  assert(contractToValidate.result && typeof contractToValidate.result.fileName === "string", "contract.result.fileName is required.");

  for (const [index, sample] of contractToValidate.samples.entries()) {
    assert(typeof sample.name === "string" && sample.name, `samples[${index}].name is required.`);
    assert(typeof sample.inputFile === "string" && sample.inputFile, `samples[${index}].inputFile is required.`);
  }
}

function assert(value, message) {
  if (!value) {
    throw new Error(message);
  }
}
