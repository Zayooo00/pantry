import { test, expect, type Page } from "@playwright/test";
import { loginAs } from "./auth";

async function addItem(page: Page, roomId: string, name: string) {
  await page.goto(`/items/new?room=${roomId}`);
  const nameInput = page.locator('input[name="name"]');
  await nameInput.click();
  await nameInput.press("ControlOrMeta+a");
  await nameInput.fill(name);
  await page.getByRole("button", { name: /^Save item$/ }).click();
  await page.waitForURL(/\/items\/[^/]+$/);
}

test("adds an item to a room — lands on item detail and shows up in the room list", async ({
  page,
}) => {
  await loginAs(page);
  const itemName = `Test grain ${Date.now()}`;
  await addItem(page, "pantry", itemName);

  await expect(page).toHaveURL(/\/items\/[^/]+$/);
  await expect(page.getByRole("heading", { level: 1, name: new RegExp(itemName, "i") })).toBeVisible();

  await page.locator("aside").getByRole("link", { name: "Pantry", exact: true }).click();
  await expect(page).toHaveURL(/\/rooms\/pantry$/);
  await expect(page.getByRole("link", { name: new RegExp(itemName, "i") })).toBeVisible();
});

test("deletes an item — confirm dialog → redirects to room → item gone from list", async ({
  page,
}) => {
  await loginAs(page);
  const itemName = `Delete-me item ${Date.now()}`;
  await addItem(page, "pantry", itemName);

  await page.getByRole("button", { name: /^Delete$/ }).click();
  const confirm = page.locator("dialog[open]");
  await expect(confirm.getByText("Remove item?")).toBeVisible();
  await confirm.getByRole("button", { name: /^Remove item$/ }).click();

  await expect(page).toHaveURL(/\/rooms\/pantry$/);
  await expect(page.getByRole("link", { name: new RegExp(itemName, "i") })).toHaveCount(0);
});

test("marks an item as opened — button label flips and toast appears", async ({ page }) => {
  await loginAs(page);
  const itemName = `Open-me item ${Date.now()}`;
  await addItem(page, "pantry", itemName);

  const openBtn = page.getByRole("button", { name: /^Mark opened$/ });
  await openBtn.click();

  await expect(page.getByRole("button", { name: /^Re-mark opened$/ })).toBeVisible();
});
