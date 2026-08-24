import { mkdir, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { join } from "node:path";

const runId = new Date().toISOString().replace(/[:.]/g, "-");
const runDir = join(process.cwd(), "harness_runs", runId);
const commands = [
  ["npm", ["run", "typecheck"]],
  ["npm", ["run", "test:unit"]],
  ["npm", ["run", "check:artifact-version"]],
  ["npm", ["run", "check:api-contract"]],
  ["npm", ["run", "check:api-flow"]],
  ["npm", ["run", "check:a11y-static"]],
  ["npm", ["run", "build"]]
];

await mkdir(runDir, { recursive: true });

const results = [];

for (const [command, args] of commands) {
  const result = await run(command, args);
  results.push(result);
  await writeFile(
    join(runDir, `${result.name.replace(/[^a-z0-9-]/gi, "-")}.log`),
    `${result.stdout}\n${result.stderr}`
  );

  if (result.exitCode !== 0) {
    break;
  }
}

const summary = [
  "# Quality Harness Summary",
  "",
  `Run: ${runId}`,
  "",
  "| Command | Result |",
  "|---|---|",
  ...results.map((result) => `| \`${result.name}\` | ${result.exitCode === 0 ? "OK" : `NG (${result.exitCode})`} |`),
  "",
  "## 残リスク",
  "",
  "- Playwright と実ブラウザ a11y は初回対象外。",
  "- API はローカル JSON 用の簡易実装。認証とDBは未実装。"
].join("\n");

await writeFile(join(runDir, "summary.md"), `${summary}\n`);
console.log(summary);

if (results.some((result) => result.exitCode !== 0)) {
  process.exit(1);
}

function run(command, args) {
  const name = [command, ...args].join(" ");
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      env: process.env,
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
      resolve({ name, stdout, stderr, exitCode: exitCode ?? 1 });
    });
  });
}
