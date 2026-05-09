import { test, expect } from "@playwright/test";
import { loginAs } from "./auth";

test("creates a room and shows it on the rooms page and in the sidebar", async ({ page }) => {
  await loginAs(page);
  await page.goto("/rooms");

  const roomName = `Test cellar ${Date.now()}`;

  await page
    .getByRole("main")
    .getByRole("button", { name: /New room/ })
    .first()
    .click();

  const dialog = page.locator("dialog[open]");
  await dialog.getByPlaceholder("e.g. Wine cellar").fill(roomName);
  await dialog.getByPlaceholder(/short description/i).fill("End-to-end test fixture.");
  await dialog.getByRole("button", { name: /create room/i }).click();

  const tileLink = page.getByRole("link", { name: roomName, exact: true });
  await expect(tileLink).toBeVisible();

  const sidebarLink = page.locator("aside").getByRole("link", { name: roomName });
  await expect(sidebarLink).toBeVisible();

  await sidebarLink.click();
  await expect(page).toHaveURL(/\/rooms\/[^/]+$/);
});
