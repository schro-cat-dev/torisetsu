import { expect, test } from "@playwright/test";

test("TODOの作成、検索、詳細、編集、完了、削除が画面からできる", async ({ page }) => {
  const title = `E2E TODO ${Date.now()}`;
  const editedTitle = `${title} edited`;
  const editedDescription = "編集フローをPlaywrightで確認する。";
  const categoryName = `E2E分類 ${Date.now()}`;

  await page.goto("/todos");
  await expect(page).toHaveTitle("TODO管理");
  await expect(page.getByText("Quality Harness")).toHaveCount(0);

  await page.getByRole("button", { name: "分類追加" }).click();
  const categoryBar = page.locator(".category-add-form");
  await categoryBar.getByLabel("分類バーに追加する分類名").fill(categoryName);
  await categoryBar.getByRole("button", { name: "分類バーの分類色: 紫" }).click();
  await categoryBar.getByRole("button", { name: "追加" }).click();
  const categoryScroll = page.locator(".category-scroll");
  await expect(categoryScroll.getByRole("button", { name: `分類: ${categoryName}` })).toBeVisible();

  await page.getByRole("link", { name: "新規作成" }).click();
  await expect(page).toHaveURL(/\/todos\/new$/);
  await expect(page.getByRole("dialog", { name: "新しいTODO" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "新しいTODO" })).toBeVisible();
  await expect(page.getByText("一覧へ戻る")).toHaveCount(0);
  await expect(page.getByText("必須")).toHaveCount(2);
  await expect(page.getByText("任意")).toHaveCount(3);
  await expect(page.getByText("0 / 80文字")).toBeVisible();
  await expect(page.getByText("0 / 400文字")).toBeVisible();
  await expect(page.getByRole("button", { name: "分類の補足" })).toBeVisible();
  await expect(page.getByRole("button", { name: "追加する" })).toBeDisabled();

  const createForm = page.getByRole("form", { name: "新しいTODO" });
  await createForm.getByLabel("タイトル").fill(title);
  await createForm.getByLabel("説明").fill("Playwrightで主要操作を確認する。");
  await expect(page.getByText(`${title.length} / 80文字`)).toBeVisible();
  await createForm.getByLabel("分類", { exact: true }).selectOption({ label: categoryName });
  await createForm.getByLabel("優先度").selectOption("high");
  await createForm.getByLabel("期限").fill("2026-09-03");
  await createForm.getByRole("button", { name: "追加する" }).click();

  await expect(page.getByText(title)).toBeVisible();
  await expect(page.getByText(`分類: ${categoryName}`)).toBeVisible();

  await categoryScroll.getByRole("button", { name: `分類: ${categoryName}` }).click();
  await expect(page.getByText(title)).toBeVisible();
  await page.getByLabel("並び順").selectOption("priorityDueAsc");

  await page.getByRole("textbox", { name: "検索" }).fill(title);
  await expect(page.getByText(title)).toBeVisible();
  await expect(page.getByText("品質ハーネスの最小チェックを通す")).toBeHidden();
  await page.getByRole("textbox", { name: "検索" }).fill("");

  const item = page.locator(".todo-item").filter({ hasText: title });
  await item.locator(".todo-summary-button").click();
  await expect(item.locator(".todo-inline-detail").getByRole("heading", { name: title })).toBeVisible();
  await item.locator(".todo-summary-button").click();
  await expect(item.locator(".todo-inline-detail")).toHaveCount(0);
  await expect(item).toHaveCount(1);
  await expect(item.locator(".todo-actions").getByRole("button", { name: "詳細", exact: true })).toHaveCount(0);

  await item.getByRole("link", { name: "編集" }).click();
  await expect(page.getByRole("dialog", { name: "TODO詳細" })).toHaveCount(0);
  await expect(page.getByRole("dialog", { name: "TODOを編集" })).toBeVisible();
  const editForm = page.getByRole("form", { name: "TODOを編集" });
  await editForm.getByLabel("タイトル").fill(editedTitle);
  await editForm.getByLabel("説明").fill(editedDescription);
  await editForm.getByLabel("分類", { exact: true }).selectOption("category-work");
  await expect(editForm.getByText(`${editedTitle.length} / 80文字`)).toBeVisible();
  await editForm.getByRole("button", { name: "保存する" }).click();

  const editedItem = page.locator(".todo-item").filter({ hasText: editedTitle });
  await expect(editedItem.getByText(editedDescription)).toBeVisible();
  await expect(editedItem.getByText("分類: 仕事")).toBeVisible();

  await editedItem.getByRole("checkbox").click();
  await expect(editedItem).toHaveCount(0);

  await page.getByRole("link", { name: "完了済み" }).click();
  await expect(page).toHaveURL(/\/todos\/completed$/);
  await expect(page.getByRole("link", { name: "未完了を見る" })).toBeVisible();
  await expect(editedItem.locator(".badge.status-done", { hasText: "完了" })).toBeVisible();

  page.once("dialog", (dialog) => dialog.accept());
  await editedItem.getByRole("button", { name: "削除" }).click();
  await expect(editedItem).toHaveCount(0);
});
