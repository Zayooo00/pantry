import { test, expect } from "@playwright/test";
import { loginAs } from "./auth";

const PIXEL_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgAAIAAAUAAeImBZsAAAAASUVORK5CYII=";

test("uploads a photo on new item, photo persists on item detail", async ({ page }) => {
  await loginAs(page);
  await page.goto("/items/new?room=pantry");

  const fileInput = page.locator('input[type="file"]').first();
  await fileInput.setInputFiles({
    name: "test.png",
    mimeType: "image/png",
    buffer: Buffer.from(PIXEL_PNG_BASE64, "base64"),
  });

  await expect(page.getByRole("button", { name: /^Replace from files$/ })).toBeVisible();

  const itemName = `Photo item ${Date.now()}`;
  const nameInput = page.getByRole("main").locator('input[name="name"]');
  await nameInput.click();
  await nameInput.fill(itemName);
  await page.getByRole("button", { name: /^Save item$/ }).click();

  await expect(page).toHaveURL(/\/items\/[a-f0-9-]{36}$/, { timeout: 20_000 });
  const photo = page.getByAltText(itemName).first();
  await expect(photo).toBeAttached();
  const src = (await photo.getAttribute("src")) ?? "";
  expect(decodeURIComponent(src)).toMatch(/\/api\/photos\/items\//);
});

test("rejects non-image upload with a helpful error", async ({ page }) => {
  await loginAs(page);
  await page.goto("/items/new?room=pantry");

  const fileInput = page.locator('input[type="file"]').first();
  await fileInput.setInputFiles({
    name: "notes.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("hello", "utf8"),
  });

  await expect(page.getByText(/only image uploads are allowed/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /^Replace from files$/ })).toHaveCount(0);
});
