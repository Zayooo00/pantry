import { test, expect } from "@playwright/test";
import { SEED_USER } from "./auth";

test("forgot password — submitting an email shows the success message", async ({ page }) => {
  await page.goto("/forgot-password");
  const email = page.locator('input[name="email"]');
  await email.click();
  await email.press("ControlOrMeta+a");
  await email.fill(SEED_USER.email);
  await page.getByRole("button", { name: /^Send reset link$/ }).click();

  await expect(page.getByText(/we've sent a reset link/i)).toBeVisible();
});

test("reset password without a token shows the missing-token error", async ({ page }) => {
  await page.goto("/reset-password");
  await expect(page.getByText(/missing its token/i)).toBeVisible();
});
