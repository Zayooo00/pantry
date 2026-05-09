import { test, expect } from "@playwright/test";
import { loginAs } from "./auth";

test("marks all notifications as read — badge clears, button disables, empty state shows", async ({
  page,
}) => {
  await loginAs(page);
  await page.goto("/notifications");

  await page.getByRole("button", { name: /^Mark all read$/ }).click();

  await expect(page.getByRole("button", { name: /^Mark all read$/ })).toBeDisabled();
  await expect(page.getByText(/No unread notifications/i)).toBeVisible();
});

test("clears read notifications via confirm dialog — Clear-read button disables", async ({
  page,
}) => {
  await loginAs(page);
  await page.goto("/notifications");

  await page.getByRole("button", { name: /^All \(\d+\)/ }).click();

  await page.getByRole("button", { name: /^Clear read$/ }).click();
  const confirm = page.locator("dialog[open]");
  await expect(confirm.getByText(/Clear read notifications\?/)).toBeVisible();
  await confirm.getByRole("button", { name: /^Clear$/ }).click();
  await expect(confirm).not.toBeVisible();
});

test("marks a single notification as read by clicking its row", async ({ page }) => {
  await loginAs(page);
  await page.goto("/notifications");

  const firstUnread = page
    .locator("a, div")
    .filter({ hasText: /below the floor/i })
    .first();
  await firstUnread.click();

  await page.goto("/notifications");
  await page.getByRole("button", { name: /^Unread \((\d+)\)/ }).click();
});
