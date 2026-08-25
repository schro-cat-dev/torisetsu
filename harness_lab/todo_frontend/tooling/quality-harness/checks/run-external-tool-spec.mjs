import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { join } from "node:path";

const root = process.cwd();
const specPath = process.argv[2];
const outputDir = process.env.HARNESS_RUN_DIR;

if (!specPath) {
  throw new Error("Usage: <external-tool-spec-runner> <spec.json>");
}

const spec = JSON.parse(await readFile(join(root, specPath), "utf8"));
validateSpec(spec);

for (const file of spec.preflightFiles ?? []) {
  await assertExists(join(root, file), `${spec.name}: required file is missing: ${file}`);
}

const restoredFiles = await backupFiles(spec.restoreFiles ?? []);
const result = await runSpec(spec);

await restoreFiles(restoredFiles);
await writeResult(spec, result);

if (result.exitCode !== 0) {
  process.exit(result.exitCode);
}

console.log(`External tool OK: ${spec.name}`);

async function runSpec(specToRun) {
  const command = resolveCommand(specToRun.command.bin);
  const args = specToRun.command.args ?? [];

  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: root,
      env: {
        ...process.env,
        ...(specToRun.command.env ?? {})
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
    child.on("error", (error) => {
      resolve({ exitCode: 1, stdout, stderr: `${stderr}${error.message}\n` });
    });
    child.on("close", (exitCode) => {
      resolve({ exitCode: exitCode ?? 1, stdout, stderr });
    });
  });
}

function resolveCommand(bin) {
  if (bin === "node") return process.execPath;
  if (typeof bin === "string" && bin.trim()) return bin;
  throw new Error("spec.command.bin is required.");
}

async function backupFiles(files) {
  const backups = [];
  for (const file of files) {
    backups.push({
      file,
      content: await readFile(join(root, file), "utf8")
    });
  }
  return backups;
}

async function restoreFiles(backups) {
  for (const backup of backups) {
    await writeFile(join(root, backup.file), backup.content);
  }
}

async function writeResult(specToWrite, result) {
  if (!outputDir) return;

  await mkdir(outputDir, { recursive: true });
  const payload = {
    schemaVersion: "external-tool-check-result.v1",
    generatedAt: new Date().toISOString(),
    name: specToWrite.name,
    tool: specToWrite.tool,
    specPath,
    exitCode: result.exitCode,
    status: result.exitCode === 0 ? "ok" : "failed",
    metadata: specToWrite.result?.metadata ?? {}
  };
  await writeFile(join(outputDir, specToWrite.result.fileName), `${JSON.stringify(payload, null, 2)}\n`);
}

function validateSpec(specToValidate) {
  assert(specToValidate.schemaVersion === "external-tool-check.v1", "spec.schemaVersion must be external-tool-check.v1.");
  assert(typeof specToValidate.name === "string" && specToValidate.name, "spec.name is required.");
  assert(typeof specToValidate.tool === "string" && specToValidate.tool, "spec.tool is required.");
  assert(specToValidate.command && typeof specToValidate.command === "object", "spec.command is required.");
  assert(typeof specToValidate.command.bin === "string" && specToValidate.command.bin, "spec.command.bin is required.");
  assert(Array.isArray(specToValidate.command.args), "spec.command.args must be an array.");
  assert(specToValidate.result && typeof specToValidate.result.fileName === "string", "spec.result.fileName is required.");

  for (const field of ["preflightFiles", "restoreFiles"]) {
    if (specToValidate[field] !== undefined) {
      assert(Array.isArray(specToValidate[field]), `spec.${field} must be an array.`);
    }
  }
}

async function assertExists(path, message) {
  try {
    await access(path);
  } catch {
    throw new Error(message);
  }
}

function assert(value, message) {
  if (!value) {
    throw new Error(message);
  }
}
