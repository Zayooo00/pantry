import { test, expect } from "@playwright/test";
import { loginAs } from "./auth";

test("adds a manual shopping item — appears in the list and the input clears", async ({
  page,
}) => {
  await loginAs(page);
  await page.goto("/shopping");

  const itemName = `Test paper towels ${Date.now()}`;
  const nameInput = page.getByRole("main").locator('input[name="name"]').first();
  await nameInput.click();
  await nameInput.press("ControlOrMeta+a");
  await nameInput.fill(itemName);
  await page.getByRole("button", { name: /^＋ Add$/ }).click();

  await expect(page.getByText(itemName)).toBeVisible();
  await expect(nameInput).toHaveValue("");
});

test("manual add increments the sidebar shopping count badge", async ({ page }) => {
  await loginAs(page);
  await page.goto("/shopping");

  const shoppingLink = page.locator("aside").getByRole("link", { name: /Shopping list/ });
  const countText = (await shoppingLink.textContent()) ?? "";
  const before = Number((countText.match(/\d+/) ?? ["0"])[0]);

  const itemName = `Sidebar count ${Date.now()}`;
  const nameInput = page.getByRole("main").locator('input[name="name"]').first();
  await nameInput.click();
  await nameInput.press("ControlOrMeta+a");
  await nameInput.fill(itemName);
  await page.getByRole("button", { name: /^＋ Add$/ }).click();

  await expect(page.getByText(itemName)).toBeVisible();
  await expect(shoppingLink).toContainText(String(before + 1));
});

test("checks an item off and completing a trip clears it from the list", async ({ page }) => {
  await loginAs(page);
  await page.goto("/shopping");

  const itemName = `Trip clear ${Date.now()}`;
  const nameInput = page.getByRole("main").locator('input[name="name"]').first();
  await nameInput.click();
  await nameInput.press("ControlOrMeta+a");
  await nameInput.fill(itemName);
  await page.getByRole("button", { name: /^＋ Add$/ }).click();

  const row = page.locator("label").filter({ hasText: itemName });
  await expect(row).toBeVisible();
  await row.click();

  const completeBtn = page.getByRole("button", { name: /Mark trip complete/i });
  await expect(completeBtn).toBeEnabled();
  await completeBtn.click();

  const confirm = page.locator("dialog[open]");
  await expect(confirm.getByText(/Trip complete\?/)).toBeVisible();
  await confirm.getByRole("button", { name: /^Clear checked$/ }).click();
  await expect(confirm).not.toBeVisible();

  await expect(page.getByText(itemName)).toHaveCount(0);
});
