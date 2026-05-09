import { test, expect } from "@playwright/test";
import { loginAs } from "./auth";

test("activity page lists seeded events and links to items", async ({ page }) => {
  await loginAs(page);
  await page.goto("/activity");

  await expect(page.getByRole("heading", { level: 1, name: /Activity/i })).toBeVisible();
  await expect(page.getByText(/Frantoio olive oil/i).first()).toBeVisible();
});
