import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataPath = join(__dirname, "data", "todos.json");
const port = Number(process.env.TODO_API_PORT ?? 4174);

const allowedStatuses = new Set(["todo", "doing", "done"]);
const allowedPriorities = new Set(["low", "medium", "high"]);

async function readTodos(context) {
  const startedAt = performance.now();
  try {
    const todos = JSON.parse(await readFile(dataPath, "utf8"));
    log("debug", "storage", "todos.read", {
      ...context,
      status: "ok",
      count: todos.length,
      durationMs: elapsed(startedAt)
    });
    return todos;
  } catch (error) {
    logError("storage", "todos.read.error", error, {
      ...context,
      durationMs: elapsed(startedAt)
    });
    throw error;
  }
}

async function writeTodos(todos, context) {
  const startedAt = performance.now();
  try {
    await writeFile(dataPath, `${JSON.stringify(todos, null, 2)}\n`);
    log("debug", "storage", "todos.write", {
      ...context,
      status: "ok",
      count: todos.length,
      durationMs: elapsed(startedAt)
    });
  } catch (error) {
    logError("storage", "todos.write.error", error, {
      ...context,
      durationMs: elapsed(startedAt)
    });
    throw error;
  }
}

function sendJson(response, statusCode, body, requestId) {
  response.writeHead(statusCode, {
    "Access-Control-Allow-Origin": "http://127.0.0.1:5173",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,X-Request-Id",
    "X-Request-Id": requestId,
    "Content-Type": "application/json; charset=utf-8"
  });
  response.end(JSON.stringify(body));
}

function sendText(response, statusCode, message, requestId) {
  response.writeHead(statusCode, {
    "Access-Control-Allow-Origin": "http://127.0.0.1:5173",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,X-Request-Id",
    "X-Request-Id": requestId,
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

function createContext(request, path) {
  const headerRequestId = request.headers["x-request-id"];
  const requestId = typeof headerRequestId === "string" && headerRequestId.trim()
    ? headerRequestId
    : `api-${randomUUID()}`;
  return {
    requestId,
    method: request.method,
    path
  };
}

function log(level, component, event, fields = {}) {
  console.log(JSON.stringify({
    time: new Date().toISOString(),
    level,
    service: "todo-api",
    component,
    event,
    ...fields
  }));
}

function logError(component, event, error, fields = {}) {
  const normalized = error instanceof Error
    ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    : {
        name: "UnknownError",
        message: String(error)
      };

  log("error", component, event, {
    ...fields,
    error: normalized
  });
}

function elapsed(startedAt) {
  return Math.round(performance.now() - startedAt);
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
  const startedAt = performance.now();
  const url = new URL(request.url ?? "/", `http://${request.headers.host}`);
  const path = url.pathname;
  const context = createContext(request, path);

  log("info", "http", "request.start", context);
  response.once("finish", () => {
    log("info", "http", "request.finish", {
      ...context,
      status: response.statusCode,
      durationMs: elapsed(startedAt)
    });
  });

  if (request.method === "OPTIONS") {
    sendText(response, 204, "", context.requestId);
    return;
  }

  try {
    if (request.method === "GET" && path === "/api/health") {
      sendJson(response, 200, { ok: true }, context.requestId);
      return;
    }

    if (request.method === "GET" && path === "/api/todos") {
      sendJson(response, 200, await readTodos(context), context.requestId);
      return;
    }

    if (request.method === "POST" && path === "/api/todos") {
      const input = await readJsonBody(request);
      const validationError = validateInput(input);
      if (validationError) {
        log("warn", "validation", "todo.create.invalid", {
          ...context,
          status: 400,
          reason: validationError
        });
        sendText(response, 400, validationError, context.requestId);
        return;
      }

      const todos = await readTodos(context);
      const todo = createTodo(input);
      await writeTodos([todo, ...todos], context);
      log("info", "todo", "todo.create", {
        ...context,
        status: 201,
        todoId: todo.id,
        totalCount: todos.length + 1
      });
      sendJson(response, 201, todo, context.requestId);
      return;
    }

    const todoMatch = path.match(/^\/api\/todos\/([^/]+)$/);
    if (todoMatch && request.method === "PATCH") {
      const input = await readJsonBody(request);
      const validationError = validateInput(input);
      if (validationError) {
        log("warn", "validation", "todo.update.invalid", {
          ...context,
          status: 400,
          reason: validationError,
          todoId: todoMatch[1]
        });
        sendText(response, 400, validationError, context.requestId);
        return;
      }

      const todos = await readTodos(context);
      const index = todos.findIndex((todo) => todo.id === todoMatch[1]);
      if (index === -1) {
        log("warn", "todo", "todo.update.notFound", {
          ...context,
          status: 404,
          todoId: todoMatch[1]
        });
        sendText(response, 404, "TODOが見つかりません。", context.requestId);
        return;
      }

      const updated = updateTodo(todos[index], input);
      todos[index] = updated;
      await writeTodos(todos, context);
      log("info", "todo", "todo.update", {
        ...context,
        status: 200,
        todoId: updated.id
      });
      sendJson(response, 200, updated, context.requestId);
      return;
    }

    const statusMatch = path.match(/^\/api\/todos\/([^/]+)\/status$/);
    if (statusMatch && request.method === "PATCH") {
      const input = await readJsonBody(request);
      if (!allowedStatuses.has(input.status)) {
        log("warn", "validation", "todo.status.invalid", {
          ...context,
          status: 400,
          todoId: statusMatch[1],
          requestedStatus: input.status
        });
        sendText(response, 400, "状態を確認してください。", context.requestId);
        return;
      }

      const todos = await readTodos(context);
      const index = todos.findIndex((todo) => todo.id === statusMatch[1]);
      if (index === -1) {
        log("warn", "todo", "todo.status.notFound", {
          ...context,
          status: 404,
          todoId: statusMatch[1]
        });
        sendText(response, 404, "TODOが見つかりません。", context.requestId);
        return;
      }

      const updated = {
        ...todos[index],
        status: input.status,
        updatedAt: new Date().toISOString()
      };
      todos[index] = updated;
      await writeTodos(todos, context);
      log("info", "todo", "todo.status.update", {
        ...context,
        status: 200,
        todoId: updated.id,
        todoStatus: updated.status
      });
      sendJson(response, 200, updated, context.requestId);
      return;
    }

    if (todoMatch && request.method === "DELETE") {
      const todos = await readTodos(context);
      const nextTodos = todos.filter((todo) => todo.id !== todoMatch[1]);
      if (todos.length === nextTodos.length) {
        log("warn", "todo", "todo.delete.notFound", {
          ...context,
          status: 404,
          todoId: todoMatch[1]
        });
        sendText(response, 404, "TODOが見つかりません。", context.requestId);
        return;
      }
      await writeTodos(nextTodos, context);
      log("info", "todo", "todo.delete", {
        ...context,
        status: 200,
        todoId: todoMatch[1],
        totalCount: nextTodos.length
      });
      sendJson(response, 200, { ok: true }, context.requestId);
      return;
    }

    log("warn", "http", "route.notFound", {
      ...context,
      status: 404
    });
    sendText(response, 404, "Not found.", context.requestId);
  } catch (error) {
    logError("http", "request.error", error, {
      ...context,
      status: 500,
      durationMs: elapsed(startedAt)
    });
    sendText(response, 500, error instanceof Error ? error.message : "Server error.", context.requestId);
  }
});

server.listen(port, "127.0.0.1", () => {
  log("info", "server", "server.start", {
    status: "ok",
    host: "127.0.0.1",
    port,
    url: `http://127.0.0.1:${port}`
  });
});
