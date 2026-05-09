import { test, expect } from "@playwright/test";
import { loginAs, SEED_USER } from "./auth";

test("signs in with valid credentials and lands on the dashboard", async ({ page }) => {
  await loginAs(page);
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText(SEED_USER.email)).toBeVisible();
});

test("rejects invalid credentials with a visible error", async ({ page }) => {
  await page.goto("/signin");
  const email = page.locator('input[name="email"]');
  const password = page.locator('input[name="password"]');
  await email.click();
  await email.press("ControlOrMeta+a");
  await email.fill(SEED_USER.email);
  await password.click();
  await password.press("ControlOrMeta+a");
  await password.fill("definitely-not-the-password");
  await page.getByRole("button", { name: /sign in/i }).click();

  await expect(page.getByText(/don't match/i)).toBeVisible();
  await expect(page).toHaveURL(/\/signin/);
});

test("redirects unauthenticated requests to /welcome", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/welcome/);
});
