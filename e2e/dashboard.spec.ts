import { test, expect } from "@playwright/test";
import { loginAs } from "./auth";

test("dashboard renders greeting, stat cells, and core sections after login", async ({ page }) => {
  await loginAs(page);

  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  await expect(page.getByText("Items on hand")).toBeVisible();
  await expect(page.getByText("Below threshold")).toBeVisible();
  await expect(page.getByText("Expiring ≤ 14 days")).toBeVisible();

  await expect(page.getByRole("heading", { name: /Below the/i, level: 2 })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Rooms at a glance/i, level: 2 })).toBeVisible();
});

test("dashboard top CTAs link to shopping and add-item routes", async ({ page }) => {
  await loginAs(page);

  const addItem = page.getByRole("link", { name: /Add item/i }).first();
  await addItem.click();
  await expect(page).toHaveURL(/\/items\/new/);

  await page.goto("/dashboard");
  await page.getByRole("link", { name: "Shopping list", exact: true }).first().click();
  await expect(page).toHaveURL(/\/shopping$/);
});
