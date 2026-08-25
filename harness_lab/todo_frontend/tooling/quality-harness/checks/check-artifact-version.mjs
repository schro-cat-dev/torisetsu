import { readFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const contractPath = process.argv[2];

if (!contractPath) {
  throw new Error("Usage: <artifact-version-checker> <contract.json>");
}

const contract = JSON.parse(await readFile(join(root, contractPath), "utf8"));
validateContract(contract);

const version = (await readFile(join(root, contract.versionFile), "utf8")).trim();
const packageJson = JSON.parse(await readFile(join(root, contract.packageFile), "utf8"));
const appVersionSource = await readFile(join(root, contract.appVersion.file), "utf8");
const ledger = await readFile(join(root, contract.ledgerFile), "utf8");

const appVersionMatch = appVersionSource.match(new RegExp(contract.appVersion.pattern));
const appVersion = appVersionMatch?.[1];

assert(version, "VERSION must not be empty.");
assert(packageJson.version === version, `package.json version must be ${version}.`);
assert(appVersion === version, `APP_VERSION must be ${version}.`);
assert(ledger.includes(`Current version: ${version}`), "ledger must include current version.");
assert(ledger.includes(`## ${version}`), "ledger must include a section for current version.");

console.log(`Artifact version OK: ${version}`);

function validateContract(contractToValidate) {
  assert(contractToValidate.schemaVersion === "artifact-version-contract.v1", "contract.schemaVersion must be artifact-version-contract.v1.");
  assert(typeof contractToValidate.versionFile === "string", "contract.versionFile is required.");
  assert(typeof contractToValidate.packageFile === "string", "contract.packageFile is required.");
  assert(contractToValidate.appVersion && typeof contractToValidate.appVersion.file === "string", "contract.appVersion.file is required.");
  assert(contractToValidate.appVersion && typeof contractToValidate.appVersion.pattern === "string", "contract.appVersion.pattern is required.");
  assert(typeof contractToValidate.ledgerFile === "string", "contract.ledgerFile is required.");
}

function assert(value, message) {
  if (!value) {
    throw new Error(message);
  }
}
