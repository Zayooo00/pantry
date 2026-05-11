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

test("redirects unauthenticated requests to /sign-in", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/sign-in/);
});

test("signs up a new user and lands on the verify-email page (not the dashboard)", async ({
  page,
}) => {
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

  await page.waitForURL(/\/verify-email/);
  await expect(page.getByRole("heading", { name: /one last step/i })).toBeVisible();
  await expect(page.getByText(email)).toBeVisible();
});

test("unverified user can sign in but is gated to /verify-email until they confirm", async ({
  page,
}) => {
  const stamp = Date.now();
  const email = `unv-${stamp}@pantry.test`;
  const password = "a-strong-password-1";

  await page.goto("/sign-up");
  const name = page.locator('input[name="name"]');
  const emailInput = page.locator('input[name="email"]');
  const passwordInput = page.locator('input[name="password"]');
  await name.click();
  await name.fill(`Unverified ${stamp}`);
  await emailInput.click();
  await emailInput.press("ControlOrMeta+a");
  await emailInput.fill(email);
  await passwordInput.click();
  await passwordInput.fill(password);
  await page.getByRole("button", { name: /create account/i }).click();
  await page.waitForURL(/\/verify-email/);

  await page.goto("/sign-in");
  const signInEmail = page.locator('input[name="email"]');
  const signInPassword = page.locator('input[name="password"]');
  await signInEmail.click();
  await signInEmail.press("ControlOrMeta+a");
  await signInEmail.fill(email);
  await signInPassword.click();
  await signInPassword.fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();

  // Sign-in succeeds, but middleware redirects unverified users to /verify-email.
  await page.waitForURL(/\/verify-email/);

  // Trying to navigate elsewhere also bounces back to /verify-email.
  await page.goto("/dashboard");
  await page.waitForURL(/\/verify-email/);
  await page.goto("/rooms");
  await page.waitForURL(/\/verify-email/);
});

test("signs out from the sidebar profile popover and returns to /sign-in", async ({ page }) => {
  await loginAs(page);

  await page.locator("aside").locator("button").filter({ hasText: SEED_USER.email }).click();

  await page.getByRole("button", { name: /^sign out$/i }).click({ force: true });
  await page.waitForURL("**/sign-in");

  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/sign-in/);
});
