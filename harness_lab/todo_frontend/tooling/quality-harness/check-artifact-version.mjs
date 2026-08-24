import { readFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const version = (await readFile(join(root, "VERSION"), "utf8")).trim();
const packageJson = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
const appVersionSource = await readFile(join(root, "src", "appVersion.ts"), "utf8");
const ledger = await readFile(join(root, "docs", "artifact-version-ledger.md"), "utf8");

const appVersionMatch = appVersionSource.match(/APP_VERSION\s*=\s*"([^"]+)"/);
const appVersion = appVersionMatch?.[1];

assert(version, "VERSION must not be empty.");
assert(packageJson.version === version, `package.json version must be ${version}.`);
assert(appVersion === version, `APP_VERSION must be ${version}.`);
assert(ledger.includes(`Current version: ${version}`), "ledger must include current version.");
assert(ledger.includes(`## ${version}`), "ledger must include a section for current version.");

console.log(`Artifact version OK: ${version}`);

function assert(value, message) {
  if (!value) {
    throw new Error(message);
  }
}
