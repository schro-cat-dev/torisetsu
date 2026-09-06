import { spawn } from "node:child_process";
import { mkdir, open, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const runtimeDirectory = path.join(projectRoot, ".runtime");
const logDirectory = path.join(runtimeDirectory, "logs");
const pidFile = path.join(runtimeDirectory, "web.pid");
const stdoutLog = path.join(logDirectory, "web.stdout.log");
const stderrLog = path.join(logDirectory, "web.stderr.log");
const viteEntry = path.join(projectRoot, "node_modules", "vite", "bin", "vite.js");
const appUrl = "http://127.0.0.1:5184/";

async function readPid() {
  try {
    return Number.parseInt(await readFile(pidFile, "utf8"), 10);
  } catch {
    return null;
  }
}

function isRunning(pid) {
  if (!pid) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function healthCheck() {
  try {
    const response = await fetch(appUrl);
    return response.ok;
  } catch {
    return false;
  }
}

async function status() {
  const pid = await readPid();
  const running = isRunning(pid);
  const healthy = await healthCheck();
  console.log(
    JSON.stringify(
      { running, healthy, managed: running, pid, url: appUrl },
      null,
      2,
    ),
  );
  return { running, healthy, pid };
}

async function start() {
  const currentStatus = await status();
  if (currentStatus.running) return;
  if (currentStatus.healthy) {
    throw new Error(`Port 5184 is already used by an unmanaged web process.`);
  }

  await mkdir(logDirectory, { recursive: true });
  await rm(pidFile, { force: true });
  const stdoutHandle = await open(stdoutLog, "a");
  const stderrHandle = await open(stderrLog, "a");
  const child = spawn(process.execPath, [viteEntry, "--host", "127.0.0.1", "--port", "5184"], {
    cwd: projectRoot,
    detached: true,
    stdio: ["ignore", stdoutHandle.fd, stderrHandle.fd],
  });
  await stdoutHandle.close();
  await stderrHandle.close();
  child.unref();
  await writeFile(pidFile, String(child.pid));

  for (let attempt = 0; attempt < 20; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    if (await healthCheck()) {
      await status();
      return;
    }
  }

  throw new Error(`Web app did not become healthy. See ${stderrLog}`);
}

async function stop() {
  const pid = await readPid();
  if (isRunning(pid)) {
    process.kill(-pid, "SIGTERM");
  }
  await rm(pidFile, { force: true });
  await status();
}

const command = process.argv[2];
if (command === "start") await start();
else if (command === "stop") await stop();
else if (command === "status") await status();
else {
  console.error("Usage: node scripts/runtime.mjs <start|stop|status>");
  process.exitCode = 1;
}
