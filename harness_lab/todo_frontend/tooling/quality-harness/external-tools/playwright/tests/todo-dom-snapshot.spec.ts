import { mkdir, writeFile } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import { expect, test } from "@playwright/test";
import { captureUiDomSnapshot } from "../../../../../../../internal_refs/harness_arch/ui_quality_harness/tools/ui-dom-snapshot-core.mjs";
import { assertJsonSchema, readJsonFile } from "../../../../../../../internal_refs/harness_arch/ui_quality_harness/tools/json-schema-validator.mjs";

test("configで指定した画面からDOM snapshotを生成できる", async ({ page }) => {
  const repoRoot = resolve(process.cwd(), "../..");
  const configRef = process.env.UI_DOM_CAPTURE_CONFIG;
  if (!configRef) throw new Error("UI_DOM_CAPTURE_CONFIG is required");
  const configPath = resolve(repoRoot, configRef);
  const config = await readJsonFile(configPath);
  const configSchema = await readJsonFile(resolve(repoRoot, "internal_refs/harness_arch/ui_quality_harness/contracts/ui-dom-capture.config.schema.json"));
  const snapshotSchema = await readJsonFile(resolve(repoRoot, "internal_refs/harness_arch/ui_quality_harness/contracts/ui-dom-snapshot.schema.json"));
  assertJsonSchema(config, configSchema, "DOM capture config");

  await page.goto(config.routePath);

  const snapshot = await captureUiDomSnapshot(page, config);
  assertJsonSchema(snapshot, snapshotSchema, "DOM snapshot");
  const outputPath = process.env.UI_QUALITY_RUN_DIR
    ? resolve(process.env.UI_QUALITY_RUN_DIR, process.env.UI_DOM_SNAPSHOT_FILE ?? basename(config.outputPath))
    : resolve(repoRoot, config.outputPath);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
});

test("hidden text、DOM順、視覚順、複数要素を別々に抽出できる", async ({ page }) => {
  await page.setContent(`
    <style>
      .row { display: flex; }
      .primary { order: 2; }
      .secondary { order: 1; }
      .hidden { display: none; }
    </style>
    <div class="row">
      <div class="primary">主情報</div>
      <div class="secondary">補足情報</div>
    </div>
    <div class="copy-target">shown<span class="hidden">hidden text</span><button class="action">Go</button><button class="action">Again</button></div>
  `);
  const snapshot = await captureUiDomSnapshot(page, {
    captureId: "metric-fixture",
    infos: [
      { id: "primary", selector: ".primary" },
      { id: "secondary", selector: ".secondary" }
    ],
    items: [{ selector: ".copy-target", primaryActionSelector: ".action" }],
    elements: [{ ref: "action", selector: ".action", role: "button", variant: "secondary", multiple: true }],
    consistencyGroups: [{ id: "actions", refPrefix: "action", expected: { role: "button", variant: "secondary", visible: true } }]
  });

  const primary = snapshot.infos.find((item: { id: string }) => item.id === "primary");
  const secondary = snapshot.infos.find((item: { id: string }) => item.id === "secondary");
  expect(primary.domOrder).toBeLessThan(secondary.domOrder);
  expect(primary.visualOrder).toBeGreaterThan(secondary.visualOrder);
  expect(snapshot.items[0].visibleTextLength).toBe("shown Go Again".length);
  expect(snapshot.items[0].primaryActionCount).toBe(2);
  expect(snapshot.elements.map((item: { ref: string }) => item.ref)).toEqual(["action[0]", "action[1]"]);
});
