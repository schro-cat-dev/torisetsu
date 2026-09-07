import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const testCase of [
  { id: "active-list", route: "/todos", readyRole: "heading", readyName: "TODO管理" },
  { id: "create-dialog", route: "/todos/new", readyRole: "dialog", readyName: "新しいTODO" },
  { id: "edit-dialog", route: "/todos/todo-001/edit", readyRole: "dialog", readyName: "TODOを編集" },
  { id: "completed-list", route: "/todos/completed", readyRole: "link", readyName: "未完了を見る" }
]) {
  test(`${testCase.id}に自動検出可能なa11y違反がない`, async ({ page }) => {
    await page.goto(testCase.route);
    await expect(page.getByRole(testCase.readyRole as never, { name: testCase.readyName })).toBeVisible();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
}

test("keyboardだけでdialogを開閉できfocusが見える", async ({ page }) => {
  await page.goto("/todos");
  const createLink = page.getByRole("link", { name: "新規作成" });
  await createLink.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "新しいTODO" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel("タイトル")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
});
