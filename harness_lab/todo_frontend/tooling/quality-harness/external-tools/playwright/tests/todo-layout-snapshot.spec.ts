import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";
import { validateJsonSchema } from "../../../../../../../internal_refs/harness_arch/ui_quality_harness/tools/json-schema-validator.mjs";

type Box = { x: number; y: number; width: number; height: number };
type Relation = { targetSelector: string; actionSelector: string; distanceMetric: "edgeGapPx" | "centerDistancePx"; maxDistancePx: number; boundaryCases: Array<{ actual: number; expected: string }> };
type LayoutCase = { id: string; routePath: string; viewport: { width: number; height: number }; waitForSelector: string; noHorizontalOverflow: boolean; relations: Relation[]; screenshotName: string };

const repoRoot = resolve(process.cwd(), "../..");
const policyRef = process.env.UI_LAYOUT_POLICY;
if (!policyRef) throw new Error("UI_LAYOUT_POLICY is required");
const policy = JSON.parse(readFileSync(resolve(repoRoot, policyRef), "utf8")) as { cases: LayoutCase[] };
const schema = JSON.parse(readFileSync(resolve(repoRoot, "internal_refs/harness_arch/ui_quality_harness/contracts/ui-layout-policy.schema.json"), "utf8"));
const issues = validateJsonSchema(policy, schema);
if (issues.length > 0) throw new Error(`layout policy is invalid: ${issues.map((issue) => `${issue.path} ${issue.message}`).join("; ")}`);

for (const layoutCase of policy.cases) {
  test(`layout policy case: ${layoutCase.id}`, async ({ page }, testInfo) => {
    await page.setViewportSize(layoutCase.viewport);
    await page.goto(layoutCase.routePath);
    await page.waitForSelector(layoutCase.waitForSelector);
    if (layoutCase.noHorizontalOverflow) {
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    }
    for (const relation of layoutCase.relations) {
      const target = await page.locator(relation.targetSelector).boundingBox();
      const action = await page.locator(relation.actionSelector).boundingBox();
      expect(target).not.toBeNull();
      expect(action).not.toBeNull();
      if (target && action) expect(distance(target, action, relation.distanceMetric)).toBeLessThanOrEqual(relation.maxDistancePx);
      for (const boundary of relation.boundaryCases) {
        expect(boundary.actual <= relation.maxDistancePx ? "passed" : "failed").toBe(boundary.expected);
      }
    }
    await page.screenshot({ path: testInfo.outputPath(layoutCase.screenshotName), fullPage: true });
  });
}

function distance(first: Box, second: Box, metric: Relation["distanceMetric"]) {
  if (metric === "centerDistancePx") {
    return Math.round(Math.hypot(first.x + first.width / 2 - (second.x + second.width / 2), first.y + first.height / 2 - (second.y + second.height / 2)));
  }
  const horizontal = Math.max(second.x - (first.x + first.width), first.x - (second.x + second.width), 0);
  const vertical = Math.max(second.y - (first.y + first.height), first.y - (second.y + second.height), 0);
  return Math.round(Math.hypot(horizontal, vertical));
}
