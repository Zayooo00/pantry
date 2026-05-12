import { test, expect } from "@playwright/test";
import { loginAs } from "./auth";

const SEEDED_BARCODE = "8014203778124";

test("topbar Scan button navigates to /scan", async ({ page }) => {
  await loginAs(page);
  await page
    .getByRole("link", { name: /^Scan(?: a barcode)?$/ })
    .first()
    .click();
  await page.waitForURL(/\/scan(?:\?.*)?$/);
  await expect(page.getByRole("heading", { name: /Point at a/i })).toBeVisible();
});

test("scan deep-link with seeded barcode shows the 'already in your pantry' branch", async ({
  page,
}) => {
  await loginAs(page);
  await page.goto(`/scan?code=${SEEDED_BARCODE}`);

  await expect(page.getByText(/Already in your pantry/i)).toBeVisible();
  await expect(page.getByRole("link", { name: /Open item/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Scan again$/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /\+1/ })).toBeVisible();
});

test("scan deep-link with unknown code + OFF hit offers 'Add to pantry'", async ({ page }) => {
  await loginAs(page);
  await page.goto(`/scan?code=0000000000017`);

  await expect(page.getByText(/Found on Open Food Facts/i)).toBeVisible();
  await expect(page.getByText("Mock olive oil")).toBeVisible();

  await page.getByRole("link", { name: /Add to pantry/i }).click();
  await page.waitForURL(/\/items\/new\?barcode=0000000000017&prefillFromOff=1/);
});

test("scan deep-link with unknown code + no OFF data offers 'Add manually'", async ({ page }) => {
  await loginAs(page);
  await page.goto(`/scan?code=0000000000024`);

  await expect(page.getByText(/Unknown barcode/i)).toBeVisible();
  await page.getByRole("link", { name: /Add manually/i }).click();
  await page.waitForURL(/\/items\/new\?barcode=0000000000024/);
});

test("add-item form: Look up an existing barcode shows the inline match card", async ({ page }) => {
  await loginAs(page);
  await page.goto("/items/new");

  await page.locator("#barcode-field").fill(SEEDED_BARCODE);
  await page.getByRole("button", { name: /^Look up$/ }).click();

  await expect(page.getByText(/Already in your pantry/i)).toBeVisible();
  await expect(page.getByRole("link", { name: /Open item/ })).toBeVisible();
});

test("add-item form: Look up an OFF code offers 'Fill from OFF'", async ({ page }) => {
  await loginAs(page);
  await page.goto("/items/new");

  await page.locator("#barcode-field").fill("0000000000031");
  await page.getByRole("button", { name: /^Look up$/ }).click();

  await expect(page.getByText("Mock pasta")).toBeVisible();
  await page.getByRole("button", { name: /Fill from OFF/i }).click();

  const main = page.getByRole("main");
  await expect(main.locator('input[name="name"]')).toHaveValue("Mock pasta");
  await expect(main.locator('input[name="brand"]')).toHaveValue("Mock Co");
});

test("?barcode=…&prefillFromOff=1 auto-applies the OFF data without a second click", async ({
  page,
}) => {
  await loginAs(page);
  await page.goto("/items/new?barcode=0000000000031&prefillFromOff=1");

  const main = page.getByRole("main");
  await expect(main.locator('input[name="name"]')).toHaveValue("Mock pasta");
  await expect(main.locator('input[name="brand"]')).toHaveValue("Mock Co");
  await expect(page.getByText(/Fill from OFF/i)).toHaveCount(0);
});

test("Look up tolerates whitespace in the typed barcode", async ({ page }) => {
  await loginAs(page);
  await page.goto("/items/new");

  await page.locator("#barcode-field").fill("8 014203 778124");
  await page.getByRole("button", { name: /^Look up$/ }).click();

  await expect(page.getByText(/Already in your pantry/i)).toBeVisible();
});

test("search top-hit appears when query is a seeded barcode", async ({ page }) => {
  await loginAs(page);
  await page.goto("/search");

  await page.getByRole("textbox", { name: "Search" }).fill(SEEDED_BARCODE);

  await expect(page.getByText(/Barcode match/i)).toBeVisible();
  await expect(page.getByRole("link", { name: /Open item/ })).toBeVisible();
});
