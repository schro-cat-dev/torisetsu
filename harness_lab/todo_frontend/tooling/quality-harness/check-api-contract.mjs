import { readFile } from "node:fs/promises";
import { join } from "node:path";

const dataPath = join(process.cwd(), "local-api", "data", "todos.json");
const todos = JSON.parse(await readFile(dataPath, "utf8"));
const statuses = new Set(["todo", "doing", "done"]);
const priorities = new Set(["low", "medium", "high"]);

if (!Array.isArray(todos)) {
  throw new Error("todos.json must be an array.");
}

for (const [index, todo] of todos.entries()) {
  const prefix = `todos[${index}]`;

  for (const field of ["id", "title", "description", "status", "priority", "dueDate", "createdAt", "updatedAt"]) {
    if (typeof todo[field] !== "string") {
      throw new Error(`${prefix}.${field} must be a string.`);
    }
  }

  if (!todo.id) throw new Error(`${prefix}.id is required.`);
  if (!todo.title.trim()) throw new Error(`${prefix}.title is required.`);
  if (!statuses.has(todo.status)) throw new Error(`${prefix}.status is invalid.`);
  if (!priorities.has(todo.priority)) throw new Error(`${prefix}.priority is invalid.`);
  if (Number.isNaN(Date.parse(todo.createdAt))) throw new Error(`${prefix}.createdAt is invalid.`);
  if (Number.isNaN(Date.parse(todo.updatedAt))) throw new Error(`${prefix}.updatedAt is invalid.`);
}

console.log(`API contract OK: ${todos.length} todos`);
