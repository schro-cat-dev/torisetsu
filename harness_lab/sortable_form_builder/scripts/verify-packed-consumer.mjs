import { spawnSync } from "node:child_process";
import {
  mkdtemp,
  mkdir,
  readFile,
  readdir,
  rename,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const artifactDirectory = path.join(projectRoot, ".artifacts");
const npmCacheDirectory = path.join(os.tmpdir(), "torisetsu-npm-cache");

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    env: { ...process.env, npm_config_cache: npmCacheDirectory },
  });
  if (result.status !== 0) {
    throw new Error(
      [
        `${command} ${args.join(" ")} failed with exit code ${result.status}`,
        result.stdout,
        result.stderr,
      ]
        .filter(Boolean)
        .join("\n"),
    );
  }
  return result.stdout.trim();
}

await rm(artifactDirectory, { recursive: true, force: true });
await mkdir(artifactDirectory, { recursive: true });

const packageNames = [
  "@torisetsu/configurable-list-core",
  "@torisetsu/configurable-list-react",
  "@torisetsu/configurable-list",
];

for (const packageName of packageNames) {
  run("npm", ["pack", "-w", packageName, "--pack-destination", artifactDirectory], projectRoot);
}

const tarballs = (await readdir(artifactDirectory)).filter((name) => name.endsWith(".tgz"));
const findTarball = (fragment) => {
  const filename = tarballs.find((name) => name.includes(fragment));
  if (!filename) throw new Error(`Packed artifact not found: ${fragment}`);
  return `file:${path.join(artifactDirectory, filename)}`;
};

const consumerDirectory = await mkdtemp(
  path.join(os.tmpdir(), "configurable-list-consumer-"),
);
await mkdir(path.join(consumerDirectory, "src"), { recursive: true });

async function linkInstalledDependencies() {
  const sourceNodeModules = path.join(projectRoot, "node_modules");
  const targetNodeModules = path.join(consumerDirectory, "node_modules");
  await mkdir(targetNodeModules, { recursive: true });

  for (const entry of await readdir(sourceNodeModules, { withFileTypes: true })) {
    if (entry.name === ".bin" || entry.name === ".package-lock.json" || entry.name === "@torisetsu") {
      continue;
    }
    const source = path.join(sourceNodeModules, entry.name);
    const target = path.join(targetNodeModules, entry.name);
    if (entry.name.startsWith("@") && entry.isDirectory()) {
      await mkdir(target, { recursive: true });
      for (const scopedEntry of await readdir(source, { withFileTypes: true })) {
        await symlink(
          path.join(source, scopedEntry.name),
          path.join(target, scopedEntry.name),
          scopedEntry.isDirectory() ? "dir" : "file",
        );
      }
      continue;
    }
    await symlink(source, target, entry.isDirectory() ? "dir" : "file");
  }
}

async function unpackTarball(fragment, packageDirectoryName) {
  const tarballReference = findTarball(fragment).replace(/^file:/, "");
  const extractionDirectory = path.join(consumerDirectory, `.extract-${packageDirectoryName}`);
  await mkdir(extractionDirectory, { recursive: true });
  run("tar", ["-xzf", tarballReference, "-C", extractionDirectory], projectRoot);
  const packageScopeDirectory = path.join(
    consumerDirectory,
    "node_modules",
    "@torisetsu",
  );
  await mkdir(packageScopeDirectory, { recursive: true });
  await rename(
    path.join(extractionDirectory, "package"),
    path.join(packageScopeDirectory, packageDirectoryName),
  );
}

await writeFile(
  path.join(consumerDirectory, "package.json"),
  JSON.stringify(
    {
      name: "configurable-list-packed-consumer",
      private: true,
      version: "0.0.0",
      type: "module",
      scripts: { build: "tsc --noEmit && vite build" },
      dependencies: {
        "@torisetsu/configurable-list-core": findTarball("list-core"),
        "@torisetsu/configurable-list-react": findTarball("list-react"),
        "@torisetsu/configurable-list": findTarball("configurable-list-0.1.0"),
        react: "19.1.1",
        "react-dom": "19.1.1",
      },
      devDependencies: {
        "@types/react": "19.1.12",
        "@types/react-dom": "19.1.9",
        "@vitejs/plugin-react": "5.0.2",
        typescript: "5.9.2",
        vite: "7.3.6",
      },
    },
    null,
    2,
  ),
);

await writeFile(
  path.join(consumerDirectory, "tsconfig.json"),
  JSON.stringify(
    {
      compilerOptions: {
        target: "ES2022",
        lib: ["DOM", "DOM.Iterable", "ES2022"],
        strict: true,
        skipLibCheck: true,
        module: "ESNext",
        moduleResolution: "Bundler",
        jsx: "react-jsx",
        noEmit: true,
      },
      include: ["src", "vite.config.ts"],
    },
    null,
    2,
  ),
);

await writeFile(
  path.join(consumerDirectory, "vite.config.ts"),
  'import react from "@vitejs/plugin-react";\nimport { defineConfig } from "vite";\n\nexport default defineConfig({ plugins: [react()] });\n',
);
await writeFile(
  path.join(consumerDirectory, "index.html"),
  '<!doctype html><html lang="ja"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Package consumer</title></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>\n',
);
await writeFile(
  path.join(consumerDirectory, "src", "main.tsx"),
  `import { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ConfigurableCollectionEditor,
  type CollectionDefinition,
  type ConfigurableItem,
} from "@torisetsu/configurable-list";
import "@torisetsu/configurable-list/styles.css";

const definition = {
  schemaVersion: "configurable-collection.v1",
  id: "notes",
  label: "確認項目",
  itemLabel: "項目",
  creation: { initialTitle: { field: "title", value: "新しい項目" } },
  display: { titleField: "title", summaryField: "notes" },
  fields: [
    { name: "title", type: "text", label: "名前", required: true },
    { name: "notes", type: "textarea", label: "詳細" },
  ],
} satisfies CollectionDefinition;

function ConsumerApp() {
  const [items, setItems] = useState<Array<ConfigurableItem>>([]);
  return (
    <ConfigurableCollectionEditor
      definition={definition}
      items={items}
      onItemsChange={setItems}
    />
  );
}

createRoot(document.getElementById("root")!).render(<ConsumerApp />);
`,
);

await linkInstalledDependencies();
await unpackTarball("list-core", "configurable-list-core");
await unpackTarball("list-react", "configurable-list-react");
await unpackTarball("configurable-list-0.1.0", "configurable-list");

run(
  process.execPath,
  [path.join(projectRoot, "node_modules", "typescript", "bin", "tsc"), "--noEmit"],
  consumerDirectory,
);
run(
  process.execPath,
  [path.join(projectRoot, "node_modules", "vite", "bin", "vite.js"), "build"],
  consumerDirectory,
);

const builtHtml = await readFile(path.join(consumerDirectory, "dist", "index.html"), "utf8");
const builtAssets = await readdir(path.join(consumerDirectory, "dist", "assets"));
if (!builtHtml.includes("assets/") || !builtAssets.some((name) => name.endsWith(".js"))) {
  throw new Error("Consumer build did not emit the expected browser assets.");
}

console.log(
  JSON.stringify(
    {
      ok: true,
      packages: packageNames,
      tarballs,
      consumerTypecheck: "passed",
      consumerBuild: "passed",
      emittedAssets: builtAssets.sort(),
    },
    null,
    2,
  ),
);
