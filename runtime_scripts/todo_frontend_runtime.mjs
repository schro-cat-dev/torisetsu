#!/usr/bin/env node
/*
  用途:
    TODO Quality Harness のローカル開発用サービスをまとめて起動、停止、状態確認する。

  使い方:
    node runtime_scripts/todo_frontend_runtime.mjs start
    node runtime_scripts/todo_frontend_runtime.mjs stop
    node runtime_scripts/todo_frontend_runtime.mjs status

  起動するもの:
    - TODO API: http://127.0.0.1:4174/api/health
    - Vite dev server: http://127.0.0.1:5173/todos

  cleanup:
    stop は、このスクリプトが作成した pid / lock / temp だけを片付ける。
    local-api/data/todos.json や DB 相当の保存データは消さない。

  ログ:
    各サービスの stdout / stderr は harness_lab/todo_frontend/.runtime/logs/ に残す。
*/

import { spawn } from "node:child_process";
import { closeSync, openSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const appDir = join(repoRoot, "harness_lab", "todo_frontend");
const runtimeDir = join(appDir, ".runtime");
const pidDir = join(runtimeDir, "pids");
const logDir = join(runtimeDir, "logs");
const lockDir = join(runtimeDir, "locks");

const services = [
  {
    name: "api",
    command: process.execPath,
    args: ["local-api/server.mjs"],
    url: "http://127.0.0.1:4174/api/health",
    env: {
      TODO_API_PORT: "4174"
    }
  },
  {
    name: "web",
    command: process.execPath,
    args: ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", "5173"],
    url: "http://127.0.0.1:5173/todos",
    env: {
      VITE_TODO_API_BASE: "http://127.0.0.1:4174/api"
    }
  }
];

const action = process.argv[2];

if (!["start", "stop", "status"].includes(action ?? "")) {
  console.error("Usage: node runtime_scripts/todo_frontend_runtime.mjs <start|stop|status>");
  process.exit(1);
}

await ensureRuntimeDirs();

if (action === "start") {
  await startAll();
}

if (action === "stop") {
  await stopAll();
}

if (action === "status") {
  await statusAll();
}

async function ensureRuntimeDirs() {
  await mkdir(pidDir, { recursive: true });
  await mkdir(logDir, { recursive: true });
  await mkdir(lockDir, { recursive: true });
}

async function startAll() {
  for (const service of services) {
    const started = await startService(service);
    if (!started) {
      await statusAll();
      process.exitCode = 1;
      return;
    }
  }
  await statusAll();
}

async function startService(service) {
  const existingPid = await readPid(service.name);
  if (existingPid && isRunning(existingPid)) {
    console.log(`[runtime] ${service.name} already running pid=${existingPid}`);
    return true;
  }

  await cleanupServiceFiles(service.name);

  if (await isHealthy(service.url)) {
    console.error(`[runtime] ${service.name} is already healthy but is not managed by this script.`);
    console.error(`[runtime] stop the existing service first, or change the port before starting.`);
    return false;
  }

  const stdoutPath = join(logDir, `${service.name}.stdout.log`);
  const stderrPath = join(logDir, `${service.name}.stderr.log`);
  const stdoutFd = openSync(stdoutPath, "a");
  const stderrFd = openSync(stderrPath, "a");

  const child = spawn(service.command, service.args, {
    cwd: appDir,
    detached: true,
    env: {
      ...process.env,
      ...service.env
    },
    stdio: ["ignore", stdoutFd, stderrFd]
  });

  child.unref();
  closeSync(stdoutFd);
  closeSync(stderrFd);

  await writeFile(pidPath(service.name), `${child.pid}\n`);
  await writeFile(join(lockDir, `${service.name}.lock`), new Date().toISOString());

  const ready = await waitForService(service, child.pid);
  if (!ready) {
    console.error(`[runtime] ${service.name} failed to become ready pid=${child.pid}`);
    console.error(`[runtime] see logs: ${stdoutPath} ${stderrPath}`);
    return false;
  }

  console.log(`[runtime] ${service.name} started pid=${child.pid} url=${service.url}`);
  return true;
}

async function stopAll() {
  for (const service of [...services].reverse()) {
    await stopService(service.name);
  }
  await rm(lockDir, { recursive: true, force: true });
  await mkdir(lockDir, { recursive: true });
  console.log("[runtime] cleanup complete: pid and lock files removed. data files kept.");
}

async function stopService(name) {
  const pid = await readPid(name);
  if (!pid) {
    await cleanupServiceFiles(name);
    console.log(`[runtime] ${name} not managed by this script`);
    return;
  }

  if (!isRunning(pid)) {
    await cleanupServiceFiles(name);
    console.log(`[runtime] ${name} already stopped pid=${pid}`);
    return;
  }

  killProcessGroup(pid, "SIGTERM");
  const stopped = await waitUntilStopped(pid);
  if (!stopped && isRunning(pid)) {
    killProcessGroup(pid, "SIGKILL");
  }
  await cleanupServiceFiles(name);
  console.log(`[runtime] ${name} stopped pid=${pid}`);
}

async function statusAll() {
  for (const service of services) {
    const pid = await readPid(service.name);
    const managed = pid ? isRunning(pid) : false;
    const healthy = await isHealthy(service.url);
    const pidText = pid ? `pid=${pid}` : "pid=none";
    console.log(`[runtime] ${service.name} managed=${managed} health=${healthy} ${pidText} url=${service.url}`);
  }
}

async function waitForService(service, pid) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (!isRunning(pid)) {
      return false;
    }
    if (await isHealthy(service.url)) {
      return true;
    }
    await sleep(250);
  }
  return false;
}

async function waitUntilStopped(pid) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (!isRunning(pid)) {
      return true;
    }
    await sleep(200);
  }
  return false;
}

async function isHealthy(url) {
  try {
    const response = await fetch(url);
    return response.ok;
  } catch {
    return false;
  }
}

function isRunning(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function killProcessGroup(pid, signal) {
  try {
    process.kill(-pid, signal);
  } catch {
    process.kill(pid, signal);
  }
}

async function readPid(name) {
  try {
    const raw = await readFile(pidPath(name), "utf8");
    const pid = Number(raw.trim());
    return Number.isInteger(pid) && pid > 0 ? pid : 0;
  } catch {
    return 0;
  }
}

async function cleanupServiceFiles(name) {
  await rm(pidPath(name), { force: true });
  await rm(join(lockDir, `${name}.lock`), { force: true });
}

function pidPath(name) {
  return join(pidDir, `${name}.pid`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
