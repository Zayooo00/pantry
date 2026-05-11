import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db, emailVerifications, users } from "@/db";
import { hashPassword, verifyPassword } from "@/lib/password";

const sessionMock = vi.hoisted(() => ({ value: null as { user?: { id: string } } | null }));

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => sessionMock.value),
}));

import { PATCH } from "@/app/api/me/route";

function jsonReq(body: unknown) {
  return new NextRequest("http://l/api/me", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(async () => {
  const passwordHash = await hashPassword("hunter2hunter");
  await db.insert(users).values({
    id: "u1",
    email: "alex@example.com",
    name: "Alex",
    passwordHash,
    emailVerifiedAt: new Date(),
    passwordVersion: 3,
  });
  sessionMock.value = { user: { id: "u1" } };
});

describe("PATCH /api/me", () => {
  it("returns 401 when no session", async () => {
    sessionMock.value = null;
    const res = await PATCH(jsonReq({ name: "Anyone" }));
    expect(res.status).toBe(401);
  });

  it("updates the user's name", async () => {
    const res = await PATCH(jsonReq({ name: "Alexander" }));
    expect(res.status).toBe(200);
    const found = await db.select().from(users).where(eq(users.id, "u1"));
    expect(found[0].name).toBe("Alexander");
  });

  it("changes the email and lowercases it", async () => {
    const res = await PATCH(
      jsonReq({ email: "ALEX2@example.COM", currentPassword: "hunter2hunter" }),
    );
    expect(res.status).toBe(200);
    const found = await db.select().from(users).where(eq(users.id, "u1"));
    expect(found[0].email).toBe("alex2@example.com");
  });

  it("resets verification and bumps passwordVersion when the email changes", async () => {
    const res = await PATCH(
      jsonReq({ email: "alex2@example.com", currentPassword: "hunter2hunter" }),
    );
    expect(res.status).toBe(200);
    const found = await db.select().from(users).where(eq(users.id, "u1"));
    expect(found[0].emailVerifiedAt).toBeNull();
    expect(found[0].passwordVersion).toBe(4);
    const tokens = await db
      .select()
      .from(emailVerifications)
      .where(eq(emailVerifications.userId, "u1"));
    expect(tokens).toHaveLength(1);
    expect(tokens[0].usedAt).toBeNull();
  });

  it("leaves verification intact when only the name changes", async () => {
    const res = await PATCH(jsonReq({ name: "Alexander" }));
    expect(res.status).toBe(200);
    const found = await db.select().from(users).where(eq(users.id, "u1"));
    expect(found[0].emailVerifiedAt).not.toBeNull();
    expect(found[0].passwordVersion).toBe(3);
    const tokens = await db
      .select()
      .from(emailVerifications)
      .where(eq(emailVerifications.userId, "u1"));
    expect(tokens).toHaveLength(0);
  });

  it("rejects email change to one already in use", async () => {
    await db.insert(users).values({
      id: "u2",
      email: "taken@example.com",
      name: "Other",
      passwordHash: await hashPassword("anypass12"),
    });
    const res = await PATCH(
      jsonReq({ email: "taken@example.com", currentPassword: "hunter2hunter" }),
    );
    expect(res.status).toBe(409);
  });

  it("changes password when current password matches", async () => {
    const res = await PATCH(
      jsonReq({ currentPassword: "hunter2hunter", newPassword: "newpass12345" }),
    );
    expect(res.status).toBe(200);
    const found = await db.select().from(users).where(eq(users.id, "u1"));
    expect(await verifyPassword("newpass12345", found[0].passwordHash)).toBe(true);
    expect(await verifyPassword("hunter2hunter", found[0].passwordHash)).toBe(false);
  });

  it("rejects password change when current password is wrong", async () => {
    const res = await PATCH(jsonReq({ currentPassword: "wrong", newPassword: "newpass12345" }));
    expect(res.status).toBe(400);
  });

  it("rejects password change with no current password supplied", async () => {
    const res = await PATCH(jsonReq({ newPassword: "newpass12345" }));
    expect(res.status).toBe(400);
  });
});
