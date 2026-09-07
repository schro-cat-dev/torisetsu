import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { validateJsonSchema } from "../../../../../../../internal_refs/harness_arch/ui_quality_harness/tools/json-schema-validator.mjs";

type LocatorSpec = { kind: "role" | "label" | "text" | "selector"; role?: string; name: string; disabled?: boolean };
type VisualCase = {
  id: string;
  routePath: string;
  viewport: { width: number; height: number };
  ready: LocatorSpec;
  intercepts: Array<{ urlPattern: string; method: string; delayMs?: number; status?: number; body?: string }>;
  actions: Array<{ type: "fill" | "click" | "press" | "expectText"; locator?: LocatorSpec; value: string }>;
  screenshotName: string;
};
type VisualManifest = { schemaVersion: string; manifestId: string; thresholdPolicyRef: string; cases: VisualCase[] };
type ThresholdPolicy = { maxDiffPixelRatio: number; boundaryCases: Array<{ actual: number; expected: "passed" | "failed" }> };

const repoRoot = resolve(process.cwd(), "../..");
const manifestRef = process.env.UI_VISUAL_MANIFEST;
if (!manifestRef) throw new Error("UI_VISUAL_MANIFEST is required");
const manifestPath = resolve(repoRoot, manifestRef);
const manifest = readJson(manifestPath) as VisualManifest;
const thresholdPolicy = readJson(resolve(dirname(manifestPath), manifest.thresholdPolicyRef)) as ThresholdPolicy;
assertSchema(manifest, "ui-visual-manifest.schema.json", "visual manifest");
assertSchema(thresholdPolicy, "ui-visual-threshold-policy.schema.json", "visual threshold policy");
assertUnique(manifest.cases.map((item) => item.id), "visual case id");
assertUnique(manifest.cases.map((item) => item.screenshotName), "screenshot name");

for (const visualCase of manifest.cases) {
  test(`visual manifest case: ${visualCase.id}`, async ({ page }) => {
    await configureIntercepts(page, visualCase);
    await page.setViewportSize(visualCase.viewport);
    await page.goto(visualCase.routePath);
    await assertReady(page, visualCase.ready);
    for (const action of visualCase.actions) await runAction(page, action);
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot(visualCase.screenshotName, {
      fullPage: true,
      animations: "disabled",
      caret: "hide",
      maxDiffPixelRatio: thresholdPolicy.maxDiffPixelRatio
    });
  });
}

async function configureIntercepts(page: Page, visualCase: VisualCase) {
  for (const intercept of visualCase.intercepts) {
    await page.route(intercept.urlPattern, async (route) => {
      if (route.request().method() !== intercept.method) return route.continue();
      if (intercept.delayMs) await new Promise((resolveDelay) => setTimeout(resolveDelay, intercept.delayMs));
      if (intercept.status) return route.fulfill({ status: intercept.status, body: intercept.body ?? "", contentType: "text/plain" });
      return route.continue();
    });
  }
}

async function assertReady(page: Page, ready: LocatorSpec) {
  const target = locator(page, ready);
  await expect(target).toBeVisible();
  if (ready.disabled === true) await expect(target).toBeDisabled();
  if (ready.disabled === false) await expect(target).toBeEnabled();
}

async function runAction(page: Page, action: VisualCase["actions"][number]) {
  if (action.type === "expectText") {
    await expect(page.getByText(action.value)).toBeVisible();
    return;
  }
  if (!action.locator) throw new Error(`${action.type} requires locator`);
  const target = locator(page, action.locator);
  if (action.type === "fill") await target.fill(action.value);
  if (action.type === "click") await target.click();
  if (action.type === "press") await target.press(action.value);
}

function locator(page: Page, spec: LocatorSpec): Locator {
  if (spec.kind === "role") return page.getByRole(spec.role as never, { name: spec.name });
  if (spec.kind === "label") return page.getByLabel(spec.name);
  if (spec.kind === "text") return page.getByText(spec.name);
  return page.locator(spec.name);
}

function readJson(filePath: string): unknown {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function assertSchema(value: unknown, schemaFile: string, label: string) {
  const schema = readJson(resolve(repoRoot, "internal_refs/harness_arch/ui_quality_harness/contracts", schemaFile));
  const issues = validateJsonSchema(value, schema);
  if (issues.length > 0) throw new Error(`${label} is invalid: ${issues.map((issue) => `${issue.path} ${issue.message}`).join("; ")}`);
}

function assertUnique(values: string[], label: string) {
  if (new Set(values).size !== values.length) throw new Error(`${label} must be unique`);
}
