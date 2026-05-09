import { type Page, expect } from "@playwright/test";

export const SEED_USER = {
  email: "alex@pantry.local",
  password: "password123",
  name: "Alex Hsu",
};

export async function loginAs(page: Page, user = SEED_USER) {
  await page.goto("/signin");
  const email = page.locator('input[name="email"]');
  const password = page.locator('input[name="password"]');
  await email.click();
  await email.press("ControlOrMeta+a");
  await email.fill(user.email);
  await password.click();
  await password.press("ControlOrMeta+a");
  await password.fill(user.password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL("**/dashboard");
  await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible();
}
