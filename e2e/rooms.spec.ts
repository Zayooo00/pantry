import { test, expect, type Page } from "@playwright/test";
import { loginAs } from "./auth";

async function createRoom(page: Page, name: string, subtitle = "End-to-end test fixture.") {
  await page
    .getByRole("main")
    .getByRole("button", { name: /New room/ })
    .first()
    .click();
  const dialog = page.locator("dialog[open]");
  await dialog.getByPlaceholder("e.g. Wine cellar").fill(name);
  await dialog.getByPlaceholder(/short description/i).fill(subtitle);
  await dialog.getByRole("button", { name: /create room/i }).click();
  await expect(dialog).not.toBeVisible();
}

test("creates a room - modal closes, tile + sidebar update, link navigates", async ({ page }) => {
  await loginAs(page);
  await page.goto("/rooms");

  const roomName = `Test cellar ${Date.now()}`;
  await createRoom(page, roomName);

  await expect(page.getByRole("link", { name: roomName, exact: true })).toBeVisible();

  const sidebarLink = page.locator("aside").getByRole("link", { name: roomName });
  await expect(sidebarLink).toBeVisible();

  await sidebarLink.click();
  await expect(page).toHaveURL(/\/rooms\/[^/]+$/);
});

test("renames a room - modal closes and the new name shows in sidebar and page header", async ({
  page,
}) => {
  await loginAs(page);
  await page.goto("/rooms");

  const original = `Edit test ${Date.now()}`;
  await createRoom(page, original);

  await page.getByRole("link", { name: original, exact: true }).click();
  await expect(page).toHaveURL(/\/rooms\/[^/]+$/);

  await page.getByRole("button", { name: /^Edit room$/ }).click();
  const editDialog = page.locator("dialog[open]");
  const renamed = `${original} renamed`;
  const nameInput = editDialog.locator('input[name="name"]');
  await nameInput.click();
  await nameInput.press("ControlOrMeta+a");
  await nameInput.fill(renamed);
  await editDialog.getByRole("button", { name: /save changes/i }).click();
  await expect(editDialog).not.toBeVisible();

  await expect(page.locator("aside").getByRole("link", { name: renamed })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(renamed.toLowerCase());
  await expect(
    page.locator("aside").getByRole("link", { name: original, exact: true }),
  ).toHaveCount(0);
});

test("archives a room - disappears from sidebar and All tab, appears under Archived", async ({
  page,
}) => {
  await loginAs(page);
  await page.goto("/rooms");

  const name = `Archive test ${Date.now()}`;
  await createRoom(page, name);

  await page.getByRole("link", { name: name, exact: true }).click();
  await page.waitForURL(/\/rooms\/[^/]+$/);
  await page
    .getByRole("main")
    .getByRole("button", { name: /^Archive room$/ })
    .click();

  await expect(page.getByText("This room is archived")).toBeVisible();
  await expect(page.locator("aside").getByRole("link", { name: name })).toHaveCount(0);

  await page.goto("/rooms");
  await expect(page.getByRole("link", { name: name, exact: true })).toHaveCount(0);

  await page.getByRole("tab", { name: /^Archived$/ }).click();
  await expect(page.getByRole("link", { name: name, exact: true })).toBeVisible();
});

test("deletes an empty room via confirm dialog - gone from list and sidebar", async ({ page }) => {
  await loginAs(page);
  await page.goto("/rooms");

  const name = `Delete test ${Date.now()}`;
  await createRoom(page, name);

  await page.getByRole("link", { name: name, exact: true }).click();
  await page.waitForURL(/\/rooms\/[^/]+$/);
  await page
    .getByRole("main")
    .getByRole("button", { name: /^Delete room$/ })
    .click();

  const confirm = page.locator("dialog[open]");
  await expect(confirm.getByText("Remove this room?")).toBeVisible();
  await confirm.getByRole("button", { name: /^Remove room$/ }).click();

  await expect(page).toHaveURL(/\/rooms$/);
  await expect(page.locator("aside").getByRole("link", { name: name })).toHaveCount(0);
  await expect(page.getByRole("link", { name: name, exact: true })).toHaveCount(0);
});

test("restores an archived room - reappears in sidebar and on the All tab", async ({ page }) => {
  await loginAs(page);
  await page.goto("/rooms");

  const name = `Restore test ${Date.now()}`;
  await createRoom(page, name);

  await page.getByRole("link", { name: name, exact: true }).click();
  await page.waitForURL(/\/rooms\/[^/]+$/);
  await page
    .getByRole("main")
    .getByRole("button", { name: /^Archive room$/ })
    .click();
  await expect(page.getByText("This room is archived")).toBeVisible();

  await page
    .getByRole("main")
    .getByRole("button", { name: /^Restore room$/ })
    .click();
  await expect(page.getByText("This room is archived")).toHaveCount(0);

  await expect(page.locator("aside").getByRole("link", { name: name })).toBeVisible();

  await page.goto("/rooms");
  await expect(page.getByRole("link", { name: name, exact: true })).toBeVisible();
});

test("blocks deleting a non-empty seeded room with a clear message", async ({ page }) => {
  await loginAs(page);
  await page.goto("/rooms/pantry");

  await page
    .getByRole("main")
    .getByRole("button", { name: /^Delete room$/ })
    .click();
  const confirm = page.locator("dialog[open]");
  await expect(confirm.getByText(/still holds/)).toBeVisible();
  await expect(confirm.getByText(/Move them first/)).toBeVisible();
  await confirm.getByRole("button", { name: /^Cancel$/ }).click();
  await expect(confirm).not.toBeVisible();
  await expect(page).toHaveURL(/\/rooms\/pantry$/);
});

const MAYA = { email: "maya@pantry.local", password: "password123", name: "Maya Hsu" };

test("reorder includes shared rooms in the user's view (sidebar + rooms page)", async ({
  page,
}) => {
  await loginAs(page);

  const beforeRes = await page.request.get("/api/sidebar");
  expect(beforeRes.ok()).toBeTruthy();
  const beforeOrder: string[] = (await beforeRes.json()).rooms.map((r: { id: string }) => r.id);
  expect(beforeOrder).toContain("maya-pantry");

  const newOrder = ["maya-pantry", ...beforeOrder.filter((id) => id !== "maya-pantry")];
  const reorder = await page.request.post("/api/rooms/reorder", { data: { order: newOrder } });
  expect(reorder.ok()).toBeTruthy();

  const afterRes = await page.request.get("/api/sidebar");
  const afterOrder: string[] = (await afterRes.json()).rooms.map((r: { id: string }) => r.id);
  expect(afterOrder[0]).toBe("maya-pantry");

  await page.goto("/rooms");
  const tiles = page.getByRole("main").locator('a[href^="/rooms/"]');
  await expect(tiles.first()).toHaveAttribute("href", "/rooms/maya-pantry");

  const sidebarLinks = page.locator("aside").locator('a[href^="/rooms/"]');
  await expect(sidebarLinks.first()).toHaveAttribute("href", "/rooms/maya-pantry");

  await page.request.post("/api/rooms/reorder", { data: { order: beforeOrder } });
});

test("reorder is per-user - alex moving rooms doesn't change maya's order", async ({ browser }) => {
  test.setTimeout(120_000);
  const alexCtx = await browser.newContext();
  const alexPage = await alexCtx.newPage();
  await loginAs(alexPage);

  const mayaCtx = await browser.newContext();
  const mayaPage = await mayaCtx.newPage();
  await loginAs(mayaPage, MAYA);

  const mayaBefore: string[] = (
    await (await mayaPage.request.get("/api/sidebar")).json()
  ).rooms.map((r: { id: string }) => r.id);

  const alexBefore: string[] = (
    await (await alexPage.request.get("/api/sidebar")).json()
  ).rooms.map((r: { id: string }) => r.id);
  const alexNewOrder = [...alexBefore].reverse();
  const reorderRes = await alexPage.request.post("/api/rooms/reorder", {
    data: { order: alexNewOrder },
  });
  expect(reorderRes.ok()).toBeTruthy();

  const mayaAfter: string[] = (await (await mayaPage.request.get("/api/sidebar")).json()).rooms.map(
    (r: { id: string }) => r.id,
  );
  expect(mayaAfter).toEqual(mayaBefore);

  const alexAfter: string[] = (await (await alexPage.request.get("/api/sidebar")).json()).rooms.map(
    (r: { id: string }) => r.id,
  );
  expect(alexAfter).toEqual(alexNewOrder);

  await alexPage.request.post("/api/rooms/reorder", { data: { order: alexBefore } });

  await alexCtx.close();
  await mayaCtx.close();
});
