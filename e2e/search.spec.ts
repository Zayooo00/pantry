import { test, expect } from "@playwright/test";
import { loginAs } from "./auth";

test("finds a seeded item by name and clicking the result navigates to it", async ({ page }) => {
  await loginAs(page);
  await page.goto("/search");

  const search = page.getByRole("textbox", { name: "Search" });
  await search.fill("olive");

  const result = page.getByRole("link", { name: /Frantoio olive oil/i }).first();
  await expect(result).toBeVisible();

  await result.click();
  await page.waitForURL(/\/items\/[^/]+$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/Frantoio/i);
});

test("status=low filter shows only low-stock items", async ({ page }) => {
  await loginAs(page);
  await page.goto("/search?status=low");

  await expect(page.getByRole("link", { name: /Frantoio olive oil/i }).first()).toBeVisible();
});

test("clearing the search restores the empty state cue", async ({ page }) => {
  await loginAs(page);
  await page.goto("/search");

  const search = page.getByRole("textbox", { name: "Search" });
  await search.fill("zzz-nothing-matches");
  await expect(page.getByText(/Nothing matches/i)).toBeVisible();

  await search.press("Escape");
  await expect(search).toHaveValue("");
});
