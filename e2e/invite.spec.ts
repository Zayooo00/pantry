import { test, expect, type APIRequestContext } from "@playwright/test";
import { loginAs, SEED_USER } from "./auth";

const NORA = { email: "nora@pantry.local", password: "password123", name: "Nora Park" };

async function removeNoraIfPresent(req: APIRequestContext) {
  const res = await req.get("/api/rooms/pantry/members");
  if (!res.ok()) {
    return;
  }
  const { members } = (await res.json()) as { members: { userId: string; email: string }[] };
  const nora = members.find((m) => m.email === NORA.email);
  if (nora) {
    await req.delete(`/api/rooms/pantry/members/${nora.userId}`);
  }
}

test("invite + accept: registered invitee gets a notification, can accept, inviter is notified", async ({
  browser,
}) => {
  test.setTimeout(120_000);

  const alexCtx = await browser.newContext();
  const alexPage = await alexCtx.newPage();
  const noraCtx = await browser.newContext();
  const noraPage = await noraCtx.newPage();

  try {
    await loginAs(alexPage, SEED_USER);
    await loginAs(noraPage, NORA);

    await removeNoraIfPresent(alexPage.request);

    await alexPage.goto("/rooms/pantry");

    const membersSection = alexPage
      .getByRole("main")
      .locator("section")
      .filter({ has: alexPage.getByRole("heading", { name: /Members/ }) });
    await membersSection.getByPlaceholder("someone@example.com").fill(NORA.email);
    await membersSection.getByRole("button", { name: /^Invite$/ }).click();

    await expect(alexPage.getByText(/inbox and email/i)).toBeVisible();

    await noraPage.goto("/notifications");
    const inviteNotif = noraPage
      .locator('a[href^="/invite/"]')
      .filter({ hasText: /invited you to Pantry/i });
    await expect(inviteNotif).toBeVisible();

    await inviteNotif.click();
    await noraPage.waitForURL(/\/invite\/[^/]+$/);
    await noraPage.getByRole("button", { name: /Accept & open Pantry/i }).click();
    await noraPage.waitForURL(/\/rooms\/pantry$/);

    await expect(noraPage.locator("aside").getByRole("link", { name: /Pantry/ })).toBeVisible();

    await alexPage.goto("/notifications");
    await expect(
      alexPage.getByText(new RegExp(`${NORA.name} joined Pantry`, "i")),
    ).toBeVisible();
  } finally {
    await removeNoraIfPresent(alexPage.request).catch(() => undefined);
    await alexCtx.close();
    await noraCtx.close();
  }
});
