import { readFile } from "node:fs/promises";
import { join } from "node:path";

const files = [
  "src/features/todos/components/TodoCreateForm.tsx",
  "src/features/todos/components/TodoToolbar.tsx",
  "src/features/todos/components/TodoListSection.tsx"
];

const contents = await Promise.all(
  files.map(async (file) => [file, await readFile(join(process.cwd(), file), "utf8")])
);

const failures = [];

for (const [file, content] of contents) {
  if (content.includes("<input") && !content.includes("<label")) {
    failures.push(`${file}: input has no label nearby.`);
  }

  if (content.includes("aria-invalid") && !content.includes("aria-describedby")) {
    failures.push(`${file}: invalid state has no description.`);
  }
}

const allContent = contents.map(([, content]) => content).join("\n");
if (!allContent.includes("aria-live")) {
  failures.push("No aria-live region found for async status.");
}

if (!allContent.includes("role=\"alert\"") && !allContent.includes("aria-live")) {
  failures.push("No alert or live region found for errors.");
}

if (failures.length > 0) {
  throw new Error(`Static a11y check failed:\n${failures.join("\n")}`);
}

console.log("Static a11y check OK");
