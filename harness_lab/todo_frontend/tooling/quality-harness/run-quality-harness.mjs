import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const profilesDir = join(scriptDir, "profiles");
const profileName = process.argv[2] ?? "default";
const runId = `${new Date().toISOString().replace(/[:.]/g, "-")}-${process.pid}`;
const profileAllowedKeys = new Set(["schemaVersion", "name", "description", "stopOnFailure", "outputDir", "commands", "risks"]);
const commandAllowedKeys = new Set(["name", "command", "args", "cwd", "requires", "optionalEnv"]);
let profile;

try {
  profile = await loadProfile(profileName);
} catch {
  process.exit(1);
}

const runDir = join(process.cwd(), profile.outputDir ?? "harness_runs", runId);
const stopOnFailure = profile.stopOnFailure ?? true;

await mkdir(runDir, { recursive: true });

const results = [];

for (const step of profile.commands) {
  const result = shouldSkip(step) ? skip(step) : await run(step);
  results.push(result);
  await writeFile(
    join(runDir, `${sanitizeLogName(result.name)}.log`),
    `${result.stdout}\n${result.stderr}`
  );

  if (stopOnFailure && result.exitCode !== 0) {
    break;
  }
}

const summary = [
  "# Quality Harness Summary",
  "",
  `Run: ${runId}`,
  `Profile: ${profile.name}`,
  profile.description ? `Description: ${profile.description}` : "",
  "",
  "| Check | Command | Result |",
  "|---|---|---|",
  ...results.map(
    (result) =>
      `| \`${result.name}\` | \`${result.commandText}\` | ${formatResult(result)} |`
  ),
  "",
  "## 残リスク",
  "",
  ...(profile.risks ?? []).map((risk) => `- ${risk}`)
].join("\n");

await writeFile(join(runDir, "summary.md"), `${summary}\n`);
console.log(summary);

if (results.some((result) => result.exitCode !== 0)) {
  process.exit(1);
}

async function loadProfile(name) {
  if (!/^[a-z0-9-]+$/i.test(name)) {
    throw new Error(`Invalid profile name: ${name}`);
  }

  try {
    const raw = await readFile(join(profilesDir, `${name}.json`), "utf8");
    const loadedProfile = JSON.parse(raw);
    validateProfile(loadedProfile, name);
    return loadedProfile;
  } catch (error) {
    const profiles = await listProfiles();
    console.error(`Failed to load quality harness profile: ${name}`);
    if (profiles.length > 0) {
      console.error(`Available profiles: ${profiles.join(", ")}`);
    }
    throw error;
  }
}

async function listProfiles() {
  try {
    const files = await readdir(profilesDir);
    return files.filter((file) => file.endsWith(".json")).map((file) => file.replace(/\.json$/, "")).sort();
  } catch {
    return [];
  }
}

function validateProfile(profileToValidate, expectedName) {
  assertAllowedKeys(profileToValidate, profileAllowedKeys, "profile");
  if (profileToValidate.schemaVersion !== "quality-harness-profile.v1") {
    throw new Error("Profile schemaVersion must be quality-harness-profile.v1.");
  }

  if (profileToValidate.name !== expectedName) {
    throw new Error(`Profile name must be "${expectedName}".`);
  }

  if (!Array.isArray(profileToValidate.commands) || profileToValidate.commands.length === 0) {
    throw new Error("Profile commands must be a non-empty array.");
  }

  const seenStepNames = new Set();
  for (const [index, step] of profileToValidate.commands.entries()) {
    assertAllowedKeys(step, commandAllowedKeys, `commands[${index}]`);
    if (!step.name || typeof step.name !== "string") {
      throw new Error(`commands[${index}].name must be a string.`);
    }
    if (seenStepNames.has(step.name)) {
      throw new Error(`commands[${index}].name is duplicated: ${step.name}`);
    }
    if (!step.command || typeof step.command !== "string") {
      throw new Error(`commands[${index}].command must be a string.`);
    }
    if (step.args !== undefined && !Array.isArray(step.args)) {
      throw new Error(`commands[${index}].args must be an array.`);
    }
    if (step.requires !== undefined && !Array.isArray(step.requires)) {
      throw new Error(`commands[${index}].requires must be an array.`);
    }
    if (step.optionalEnv !== undefined && typeof step.optionalEnv !== "string") {
      throw new Error(`commands[${index}].optionalEnv must be a string.`);
    }
    for (const requiredStep of step.requires ?? []) {
      if (!seenStepNames.has(requiredStep)) {
        throw new Error(`commands[${index}] requires "${requiredStep}" before it is defined.`);
      }
    }
    seenStepNames.add(step.name);
  }
}

function shouldSkip(step) {
  return Boolean(step.optionalEnv) && process.env[step.optionalEnv] !== "1";
}

function skip(step) {
  const args = step.args ?? [];
  const commandText = [step.command, ...args].join(" ");
  const stdout = `SKIP: ${step.name} requires ${step.optionalEnv}=1\n`;
  process.stdout.write(stdout);
  return {
    name: step.name,
    commandText,
    stdout,
    stderr: "",
    exitCode: 0,
    skipped: true
  };
}

function run(step) {
  const args = step.args ?? [];
  const name = step.name;
  const commandText = [step.command, ...args].join(" ");
  return new Promise((resolve) => {
    const child = spawn(step.command, args, {
      cwd: step.cwd ? join(process.cwd(), step.cwd) : process.cwd(),
      env: {
        ...process.env,
        HARNESS_RUN_DIR: runDir,
        HARNESS_PROFILE_NAME: profile.name,
        HARNESS_RUN_ID: runId
      },
      shell: false
    });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
      process.stdout.write(chunk);
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
      process.stderr.write(chunk);
    });
    child.on("close", (exitCode) => {
      resolve({ name, commandText, stdout, stderr, exitCode: exitCode ?? 1 });
    });
  });
}

function formatResult(result) {
  if (result.skipped) {
    return "SKIP";
  }
  return result.exitCode === 0 ? "OK" : `NG (${result.exitCode})`;
}

function sanitizeLogName(name) {
  return name.replace(/[^a-z0-9-]/gi, "-");
}

function assertAllowedKeys(value, allowedKeys, label) {
  for (const key of Object.keys(value)) {
    if (!allowedKeys.has(key)) {
      throw new Error(`${label}.${key} is not allowed.`);
    }
  }
}
