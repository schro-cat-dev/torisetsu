import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("TODO画面に重大なa11y違反がない", async ({ page }) => {
  await page.goto("/todos");
  await expect(page.getByRole("heading", { name: "新しいTODO" })).toBeVisible();

  const results = await new AxeBuilder({ page })
    .disableRules(["color-contrast"])
    .analyze();

  expect(results.violations).toEqual([]);
});
