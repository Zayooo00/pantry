import { test, expect } from "@playwright/test";
import { loginAs } from "./auth";

test("room page · QR popover opens with the room's deep link and a rendered code", async ({
  page,
}) => {
  await loginAs(page);
  await page.goto("/rooms/pantry");

  await page.getByRole("button", { name: /^qr$/i }).click();

  const popover = page.getByRole("dialog").filter({ hasText: /download label/i });
  await expect(popover).toBeVisible();
  await expect(popover.locator("svg")).toBeVisible();
  await expect(popover).toContainText("/rooms/pantry");
});

test("room QR popover · closes on Escape", async ({ page }) => {
  await loginAs(page);
  await page.goto("/rooms/pantry");

  await page.getByRole("button", { name: /^qr$/i }).click();
  const popover = page.getByRole("dialog").filter({ hasText: /download label/i });
  await expect(popover).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(popover).not.toBeVisible();
});

test("item page · QR popover opens with the item's deep link", async ({ page }) => {
  await loginAs(page);
  await page.goto("/items/new?room=pantry");

  const nameInput = page.getByRole("main").locator('input[name="name"]');
  await nameInput.click();
  await nameInput.press("ControlOrMeta+a");
  await nameInput.fill(`QR test item ${Date.now()}`);

  // UUID-shaped path excludes /items/new (no 'n' in hex) and the query-bearing
  // /items/new?room=pantry. Race the wait against the click to avoid losing the
  // navigation event.
  await Promise.all([
    page.waitForURL(/\/items\/[a-f0-9-]{36}$/),
    page.getByRole("button", { name: /^Save item$/ }).click(),
  ]);
  const itemId = page.url().match(/\/items\/([a-f0-9-]{36})$/)?.[1];
  expect(itemId).toBeTruthy();

  await page.getByRole("button", { name: /^qr$/i }).click();

  const popover = page.getByRole("dialog").filter({ hasText: /download label/i });
  await expect(popover).toBeVisible();
  await expect(popover.locator("svg")).toBeVisible();
  await expect(popover).toContainText(`/items/${itemId}`);
});
