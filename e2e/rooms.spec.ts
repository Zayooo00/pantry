import { test, expect, type Page } from "@playwright/test";
import { loginAs } from "./auth";

async function createRoom(page: Page, name: string, subtitle = "End-to-end test fixture.") {
  await page
    .getByRole("main")
    .getByRole("button", { name: /New room/ })
    .first()
    .click();
  const dialog = page.locator("dialog[open]");
  await dialog.getByPlaceholder("e.g. Wine cellar").fill(name);
  await dialog.getByPlaceholder(/short description/i).fill(subtitle);
  await dialog.getByRole("button", { name: /create room/i }).click();
  await expect(dialog).not.toBeVisible();
}

test("creates a room — modal closes, tile + sidebar update, link navigates", async ({ page }) => {
  await loginAs(page);
  await page.goto("/rooms");

  const roomName = `Test cellar ${Date.now()}`;
  await createRoom(page, roomName);

  await expect(page.getByRole("link", { name: roomName, exact: true })).toBeVisible();

  const sidebarLink = page.locator("aside").getByRole("link", { name: roomName });
  await expect(sidebarLink).toBeVisible();

  await sidebarLink.click();
  await expect(page).toHaveURL(/\/rooms\/[^/]+$/);
});

test("renames a room — modal closes and the new name shows in sidebar and page header", async ({
  page,
}) => {
  await loginAs(page);
  await page.goto("/rooms");

  const original = `Edit test ${Date.now()}`;
  await createRoom(page, original);

  await page.getByRole("link", { name: original, exact: true }).click();
  await expect(page).toHaveURL(/\/rooms\/[^/]+$/);

  await page.getByRole("button", { name: /^Edit room$/ }).click();
  const editDialog = page.locator("dialog[open]");
  const renamed = `${original} renamed`;
  const nameInput = editDialog.locator('input[name="name"]');
  await nameInput.click();
  await nameInput.press("ControlOrMeta+a");
  await nameInput.fill(renamed);
  await editDialog.getByRole("button", { name: /save changes/i }).click();
  await expect(editDialog).not.toBeVisible();

  await expect(page.locator("aside").getByRole("link", { name: renamed })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(renamed.toLowerCase());
  await expect(page.locator("aside").getByRole("link", { name: original, exact: true })).toHaveCount(0);
});

test("archives a room — disappears from sidebar and All tab, appears under Archived", async ({
  page,
}) => {
  await loginAs(page);
  await page.goto("/rooms");

  const name = `Archive test ${Date.now()}`;
  await createRoom(page, name);

  await page.getByRole("link", { name: name, exact: true }).click();
  await page.waitForURL(/\/rooms\/[^/]+$/);
  await page.getByRole("main").getByRole("button", { name: /^Archive room$/ }).click();

  await expect(page.getByText("This room is archived")).toBeVisible();
  await expect(page.locator("aside").getByRole("link", { name: name })).toHaveCount(0);

  await page.goto("/rooms");
  await expect(page.getByRole("link", { name: name, exact: true })).toHaveCount(0);

  await page.getByRole("tab", { name: /^Archived$/ }).click();
  await expect(page.getByRole("link", { name: name, exact: true })).toBeVisible();
});

test("deletes an empty room via confirm dialog — gone from list and sidebar", async ({ page }) => {
  await loginAs(page);
  await page.goto("/rooms");

  const name = `Delete test ${Date.now()}`;
  await createRoom(page, name);

  await page.getByRole("link", { name: name, exact: true }).click();
  await page.waitForURL(/\/rooms\/[^/]+$/);
  await page.getByRole("main").getByRole("button", { name: /^Delete room$/ }).click();

  const confirm = page.locator("dialog[open]");
  await expect(confirm.getByText("Remove this room?")).toBeVisible();
  await confirm.getByRole("button", { name: /^Remove room$/ }).click();

  await expect(page).toHaveURL(/\/rooms$/);
  await expect(page.locator("aside").getByRole("link", { name: name })).toHaveCount(0);
  await expect(page.getByRole("link", { name: name, exact: true })).toHaveCount(0);
});

test("blocks deleting a non-empty seeded room with a clear message", async ({ page }) => {
  await loginAs(page);
  await page.goto("/rooms/pantry");

  await page.getByRole("main").getByRole("button", { name: /^Delete room$/ }).click();
  const confirm = page.locator("dialog[open]");
  await expect(confirm.getByText(/still holds/)).toBeVisible();
  await expect(confirm.getByText(/Move them first/)).toBeVisible();
  await confirm.getByRole("button", { name: /^Cancel$/ }).click();
  await expect(confirm).not.toBeVisible();
  await expect(page).toHaveURL(/\/rooms\/pantry$/);
});
