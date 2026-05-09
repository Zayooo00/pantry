import { test, expect } from "@playwright/test";
import { loginAs, SEED_USER } from "./auth";

test("renames profile — sidebar updates with the new name; restores afterwards", async ({
  page,
}) => {
  await loginAs(page);
  await page.goto("/settings");

  const newName = `Alexa Test ${Date.now() % 100000}`;
  const nameInput = page.getByRole("main").locator('input[name="name"]').first();
  await nameInput.click();
  await nameInput.press("ControlOrMeta+a");
  await nameInput.fill(newName);
  await page.getByRole("button", { name: /save profile/i }).click();

  await page.reload();
  await expect(page.locator("aside").getByText(newName)).toBeVisible();

  const restoreInput = page.getByRole("main").locator('input[name="name"]').first();
  await restoreInput.click();
  await restoreInput.press("ControlOrMeta+a");
  await restoreInput.fill(SEED_USER.name);
  await page.getByRole("button", { name: /save profile/i }).click();
  await page.reload();
  await expect(page.locator("aside").getByText(SEED_USER.name)).toBeVisible();
});
