import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataPath = join(__dirname, "data", "todos.json");
const port = Number(process.env.TODO_API_PORT ?? 4174);

const allowedStatuses = new Set(["todo", "doing", "done"]);
const allowedPriorities = new Set(["low", "medium", "high"]);

async function readTodos() {
  return JSON.parse(await readFile(dataPath, "utf8"));
}

async function writeTodos(todos) {
  await writeFile(dataPath, `${JSON.stringify(todos, null, 2)}\n`);
}

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    "Access-Control-Allow-Origin": "http://127.0.0.1:5173",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json; charset=utf-8"
  });
  response.end(JSON.stringify(body));
}

function sendText(response, statusCode, message) {
  response.writeHead(statusCode, {
    "Access-Control-Allow-Origin": "http://127.0.0.1:5173",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "text/plain; charset=utf-8"
  });
  response.end(message);
}

async function readJsonBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }

  const rawBody = Buffer.concat(chunks).toString("utf8");
  return rawBody ? JSON.parse(rawBody) : {};
}

function validateInput(input) {
  if (typeof input.title !== "string" || !input.title.trim()) {
    return "タイトルを入力してください。";
  }

  if (input.title.trim().length > 80) {
    return "タイトルは80文字以内にしてください。";
  }

  if (typeof input.description !== "string") {
    return "説明は文字列で送信してください。";
  }

  if (!allowedPriorities.has(input.priority)) {
    return "優先度を確認してください。";
  }

  if (typeof input.dueDate !== "string") {
    return "期限は文字列で送信してください。";
  }

  return "";
}

function createTodo(input) {
  const now = new Date().toISOString();
  return {
    id: `todo-${randomUUID()}`,
    title: input.title.trim(),
    description: input.description.trim(),
    status: "todo",
    priority: input.priority,
    dueDate: input.dueDate,
    createdAt: now,
    updatedAt: now
  };
}

function updateTodo(todo, input) {
  return {
    ...todo,
    title: input.title.trim(),
    description: input.description.trim(),
    priority: input.priority,
    dueDate: input.dueDate,
    updatedAt: new Date().toISOString()
  };
}

const server = createServer(async (request, response) => {
  if (request.method === "OPTIONS") {
    sendText(response, 204, "");
    return;
  }

  const url = new URL(request.url ?? "/", `http://${request.headers.host}`);
  const path = url.pathname;

  try {
    if (request.method === "GET" && path === "/api/health") {
      sendJson(response, 200, { ok: true });
      return;
    }

    if (request.method === "GET" && path === "/api/todos") {
      sendJson(response, 200, await readTodos());
      return;
    }

    if (request.method === "POST" && path === "/api/todos") {
      const input = await readJsonBody(request);
      const validationError = validateInput(input);
      if (validationError) {
        sendText(response, 400, validationError);
        return;
      }

      const todos = await readTodos();
      const todo = createTodo(input);
      await writeTodos([todo, ...todos]);
      sendJson(response, 201, todo);
      return;
    }

    const todoMatch = path.match(/^\/api\/todos\/([^/]+)$/);
    if (todoMatch && request.method === "PATCH") {
      const input = await readJsonBody(request);
      const validationError = validateInput(input);
      if (validationError) {
        sendText(response, 400, validationError);
        return;
      }

      const todos = await readTodos();
      const index = todos.findIndex((todo) => todo.id === todoMatch[1]);
      if (index === -1) {
        sendText(response, 404, "TODOが見つかりません。");
        return;
      }

      const updated = updateTodo(todos[index], input);
      todos[index] = updated;
      await writeTodos(todos);
      sendJson(response, 200, updated);
      return;
    }

    const statusMatch = path.match(/^\/api\/todos\/([^/]+)\/status$/);
    if (statusMatch && request.method === "PATCH") {
      const input = await readJsonBody(request);
      if (!allowedStatuses.has(input.status)) {
        sendText(response, 400, "状態を確認してください。");
        return;
      }

      const todos = await readTodos();
      const index = todos.findIndex((todo) => todo.id === statusMatch[1]);
      if (index === -1) {
        sendText(response, 404, "TODOが見つかりません。");
        return;
      }

      const updated = {
        ...todos[index],
        status: input.status,
        updatedAt: new Date().toISOString()
      };
      todos[index] = updated;
      await writeTodos(todos);
      sendJson(response, 200, updated);
      return;
    }

    if (todoMatch && request.method === "DELETE") {
      const todos = await readTodos();
      const nextTodos = todos.filter((todo) => todo.id !== todoMatch[1]);
      if (todos.length === nextTodos.length) {
        sendText(response, 404, "TODOが見つかりません。");
        return;
      }
      await writeTodos(nextTodos);
      sendJson(response, 200, { ok: true });
      return;
    }

    sendText(response, 404, "Not found.");
  } catch (error) {
    sendText(response, 500, error instanceof Error ? error.message : "Server error.");
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`TODO API listening on http://127.0.0.1:${port}`);
});
