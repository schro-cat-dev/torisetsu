import { spawn } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const port = 4275;
const apiBase = `http://127.0.0.1:${port}/api`;
const dataPath = join(process.cwd(), "local-api", "data", "todos.json");
const originalData = await readFile(dataPath, "utf8");
const server = spawn("node", ["local-api/server.mjs"], {
  cwd: process.cwd(),
  env: { ...process.env, TODO_API_PORT: String(port) },
  stdio: ["ignore", "pipe", "pipe"]
});

try {
  await waitForHealth();

  const created = await request("/todos", {
    method: "POST",
    body: JSON.stringify({
      title: "APIフロー確認",
      description: "作成、更新、完了、削除を確認する。",
      priority: "high",
      dueDate: "2026-09-01"
    })
  });
  assert(created.id, "created todo has id");

  const updated = await request(`/todos/${created.id}`, {
    method: "PATCH",
    body: JSON.stringify({
      title: "APIフロー確認を更新",
      description: "更新できることを確認する。",
      priority: "medium",
      dueDate: "2026-09-02"
    })
  });
  assert(updated.title === "APIフロー確認を更新", "todo title updated");

  const completed = await request(`/todos/${created.id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status: "done" })
  });
  assert(completed.status === "done", "todo status updated");

  const deleted = await request(`/todos/${created.id}`, { method: "DELETE" });
  assert(deleted.ok === true, "todo deleted");

  console.log("API flow OK: create -> update -> status -> delete");
} finally {
  server.kill();
  await writeFile(dataPath, originalData);
}

async function request(path, init = {}) {
  const response = await fetch(`${apiBase}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init
  });

  if (!response.ok) {
    throw new Error(`${init.method ?? "GET"} ${path} failed: ${response.status} ${await response.text()}`);
  }

  return response.json();
}

async function waitForHealth() {
  const started = Date.now();
  while (Date.now() - started < 5000) {
    try {
      const health = await request("/health");
      if (health.ok) return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  throw new Error("API server did not become healthy.");
}

function assert(value, message) {
  if (!value) {
    throw new Error(message);
  }
}
