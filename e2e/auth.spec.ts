import { test, expect } from "@playwright/test";
import { loginAs, SEED_USER } from "./auth";

test("signs in with valid credentials and lands on the dashboard", async ({ page }) => {
  await loginAs(page);
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText(SEED_USER.email)).toBeVisible();
});

test("rejects invalid credentials with a visible error", async ({ page }) => {
  await page.goto("/sign-in");
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
  await expect(page).toHaveURL(/\/sign-in/);
});

test("redirects unauthenticated requests to /welcome", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/welcome/);
});

test("signs up a new user, lands on dashboard, and shows them in the sidebar", async ({ page }) => {
  const stamp = Date.now();
  const email = `pw-${stamp}@pantry.test`;

  await page.goto("/sign-up");
  const name = page.locator('input[name="name"]');
  const emailInput = page.locator('input[name="email"]');
  const passwordInput = page.locator('input[name="password"]');
  await name.click();
  await name.press("ControlOrMeta+a");
  await name.fill(`Test User ${stamp}`);
  await emailInput.click();
  await emailInput.press("ControlOrMeta+a");
  await emailInput.fill(email);
  await passwordInput.click();
  await passwordInput.press("ControlOrMeta+a");
  await passwordInput.fill("a-strong-password-1");
  await page.getByRole("button", { name: /create account/i }).click();

  await page.waitForURL("**/dashboard");
  await expect(page.locator("aside").getByText(email)).toBeVisible();
});

test("signs out from the sidebar profile popover and returns to /sign-in", async ({ page }) => {
  await loginAs(page);

  await page.locator("aside").locator("button").filter({ hasText: SEED_USER.email }).click();

  await page.getByRole("button", { name: /^sign out$/i }).click();
  await page.waitForURL("**/sign-in");

  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/welcome/);
});
