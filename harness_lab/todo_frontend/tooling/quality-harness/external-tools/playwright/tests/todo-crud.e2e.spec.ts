import { expect, test } from "@playwright/test";

test("TODOの作成、検索、完了、削除が画面からできる", async ({ page }) => {
  const title = `E2E TODO ${Date.now()}`;

  await page.goto("/todos");
  await expect(page.getByRole("heading", { name: "新しいTODO" })).toBeVisible();
  await expect(page.getByRole("button", { name: "追加する" })).toBeDisabled();

  await page.getByLabel("タイトル").fill(title);
  await page.getByLabel("説明").fill("Playwrightで主要操作を確認する。");
  await page.getByLabel("優先度").selectOption("high");
  await page.getByLabel("期限").fill("2026-09-03");
  await page.getByRole("button", { name: "追加する" }).click();

  await expect(page.getByText(title)).toBeVisible();

  await page.getByRole("textbox", { name: "検索" }).fill(title);
  await expect(page.getByText(title)).toBeVisible();
  await expect(page.getByText("品質ハーネスの最小チェックを通す")).toBeHidden();

  const item = page.locator(".todo-item").filter({ hasText: title });
  await item.getByRole("checkbox").check();
  await expect(item.getByText("完了")).toBeVisible();

  page.once("dialog", (dialog) => dialog.accept());
  await item.getByRole("button", { name: "削除" }).click();
  await expect(page.getByText(title)).toBeHidden();
});
