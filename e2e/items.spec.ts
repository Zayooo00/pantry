import { test, expect, type Page } from "@playwright/test";
import { loginAs } from "./auth";

async function addItem(page: Page, roomId: string, name: string) {
  await page.goto(`/items/new?room=${roomId}`);
  const nameInput = page.getByRole("main").locator('input[name="name"]');
  await nameInput.click();
  await nameInput.press("ControlOrMeta+a");
  await nameInput.fill(name);
  await page.getByRole("button", { name: /^Save item$/ }).click();
  await page.waitForURL(/\/items\/[^/]+$/);
}

test("adds an item to a room - lands on item detail and shows up in the room list", async ({
  page,
}) => {
  await loginAs(page);
  const itemName = `Test grain ${Date.now()}`;
  await addItem(page, "pantry", itemName);

  await expect(page).toHaveURL(/\/items\/[^/]+$/);
  await expect(
    page.getByRole("heading", { level: 1, name: new RegExp(itemName, "i") }),
  ).toBeVisible();

  await page.locator('aside a[href="/rooms/pantry"]').click();
  await page.waitForURL(/\/rooms\/pantry$/);
  await expect(page.getByRole("link", { name: new RegExp(itemName, "i") })).toBeVisible();
});

test("deletes an item - confirm dialog → redirects to room → item gone from list", async ({
  page,
}) => {
  await loginAs(page);
  const itemName = `Delete-me item ${Date.now()}`;
  await addItem(page, "pantry", itemName);

  await page.getByRole("button", { name: /^Delete$/ }).click();
  const confirm = page.locator("dialog[open]");
  await expect(confirm.getByText("Remove item?")).toBeVisible();
  await confirm.getByRole("button", { name: /^Remove item$/ }).click();

  await page.waitForURL(/\/rooms\/pantry$/);
  await expect(page.getByRole("link", { name: new RegExp(itemName, "i") })).toHaveCount(0);
});

test("marks an item as opened - button label flips", async ({ page }) => {
  await loginAs(page);
  const itemName = `Open-me item ${Date.now()}`;
  await addItem(page, "pantry", itemName);

  await page.getByRole("button", { name: /^Mark opened$/ }).click();
  await expect(page.getByRole("button", { name: /^Re-mark opened$/ })).toBeVisible();
});

test("increments item count via stepper and the change persists across reload", async ({
  page,
}) => {
  await loginAs(page);
  const itemName = `Stepper item ${Date.now()}`;
  await addItem(page, "pantry", itemName);

  const countInput = page.getByRole("textbox", { name: "Count" });
  const initial = parseFloat((await countInput.inputValue()) || "0");

  await page.getByRole("button", { name: "Increase" }).click();
  await expect(async () => {
    const after = parseFloat((await countInput.inputValue()) || "0");
    expect(after).toBeGreaterThan(initial);
  }).toPass();

  const persisted = await countInput.inputValue();
  await page.waitForTimeout(1500);
  await page.reload();
  await expect(page.getByRole("textbox", { name: "Count" })).toHaveValue(persisted);
});

test("adds an item to the shopping list from item detail - sidebar count goes up", async ({
  page,
}) => {
  await loginAs(page);
  const itemName = `Shopping push ${Date.now()}`;
  await addItem(page, "pantry", itemName);

  const shoppingLink = page.locator("aside").getByRole("link", { name: /Shopping list/ });
  const countText = (await shoppingLink.textContent()) ?? "";
  const before = Number((countText.match(/\d+/) ?? ["0"])[0]);

  await page
    .getByRole("main")
    .getByRole("button", { name: /Shopping list/i })
    .click();
  await expect(page.getByRole("button", { name: /^✓ added$/ })).toBeVisible();

  await expect(shoppingLink).toContainText(String(before + 1), { timeout: 15_000 });
});

test("edits an item via the modal - heading + room list reflect the new name", async ({ page }) => {
  await loginAs(page);
  const original = `Editable item ${Date.now()}`;
  await addItem(page, "pantry", original);

  await page.getByRole("button", { name: /^Edit$/ }).click();
  const dialog = page.locator("dialog[open]");
  await expect(dialog).toBeVisible();

  const renamed = `${original} renamed`;
  const nameInput = dialog.locator('input[name="name"]').first();
  await nameInput.click();
  await nameInput.press("ControlOrMeta+a");
  await nameInput.fill(renamed);
  await dialog.getByRole("button", { name: /save changes/i }).click();
  await expect(dialog).not.toBeVisible();

  await page.goto("/rooms/pantry");
  await expect(page.getByRole("link", { name: new RegExp(renamed, "i") })).toBeVisible();
});

test("moves an item to another room - appears in target, gone from source", async ({ page }) => {
  await loginAs(page);
  const itemName = `Movable ${Date.now()}`;
  await addItem(page, "pantry", itemName);

  await page.getByRole("button", { name: /^Move$/ }).click();
  const dialog = page.locator("dialog[open]");
  await expect(dialog).toBeVisible();

  await dialog.getByRole("combobox").first().click();
  const option = page.getByRole("option", { name: /^Kitchen$/i });
  await expect(option).toBeVisible();
  await option.evaluate((el) => (el as HTMLElement).click());

  await expect(dialog.getByRole("combobox").first()).toContainText(/Kitchen/i);
  await dialog.getByRole("button", { name: /^Move item$/ }).click();
  await expect(dialog).not.toBeVisible();

  await page.goto("/rooms/kitchen");
  await expect(page.getByRole("link", { name: new RegExp(itemName, "i") })).toBeVisible();

  await page.goto("/rooms/pantry");
  await expect(page.getByRole("link", { name: new RegExp(itemName, "i") })).toHaveCount(0);
});
