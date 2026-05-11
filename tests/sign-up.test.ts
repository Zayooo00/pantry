import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { POST } from "@/app/api/sign-up/route";
import { db, users, rooms, pendingInvites, emailVerifications } from "@/db";
import { verifyPassword } from "@/lib/password";
import { generateToken, hashToken } from "@/lib/tokens";

function jsonReq(body: unknown) {
  return new NextRequest("http://localhost/api/sign-up", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/sign-up", () => {
  it("creates a user with emailVerifiedAt = null and issues a verification token", async () => {
    const res = await POST(
      jsonReq({ name: "Alex", email: "alex@example.com", password: "hunter2hunter" }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toMatchObject({ ok: true, verified: false });

    const found = await db.select().from(users).where(eq(users.email, "alex@example.com"));
    expect(found).toHaveLength(1);
    expect(found[0].emailVerifiedAt).toBeNull();
    expect(found[0].passwordHash).not.toBe("hunter2hunter");
    expect(await verifyPassword("hunter2hunter", found[0].passwordHash)).toBe(true);

    const tokens = await db
      .select()
      .from(emailVerifications)
      .where(eq(emailVerifications.userId, found[0].id));
    expect(tokens).toHaveLength(1);
    expect(tokens[0].usedAt).toBeNull();
  });

  it("normalizes email to lowercase + trim", async () => {
    const res = await POST(
      jsonReq({ name: "Alex", email: "  ALEX@Example.COM ", password: "hunter2hunter" }),
    );
    expect(res.status).toBe(200);
    const found = await db.select().from(users);
    expect(found[0].email).toBe("alex@example.com");
  });

  it("rejects when password < 8 chars", async () => {
    const res = await POST(jsonReq({ name: "Alex", email: "alex@example.com", password: "short" }));
    expect(res.status).toBe(400);
  });

  it("rejects when email is invalid", async () => {
    const res = await POST(
      jsonReq({ name: "Alex", email: "not-an-email", password: "hunter2hunter" }),
    );
    expect(res.status).toBe(400);
  });

  it("rejects when name is empty", async () => {
    const res = await POST(
      jsonReq({ name: "", email: "alex@example.com", password: "hunter2hunter" }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 409 when email already exists (case-insensitive)", async () => {
    await POST(jsonReq({ name: "Alex", email: "alex@example.com", password: "hunter2hunter" }));
    const res = await POST(
      jsonReq({ name: "Other", email: "ALEX@example.com", password: "different8" }),
    );
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.error).toMatch(/already exists/i);
  });

  it("auto-verifies when signing up with a matching invite token", async () => {
    const inviterId = randomUUID();
    await db.insert(users).values({
      id: inviterId,
      email: "inviter@example.com",
      name: "Inviter",
      passwordHash: "x",
      emailVerifiedAt: new Date(),
    });
    const roomId = "room-1";
    await db.insert(rooms).values({
      id: roomId,
      ownerId: inviterId,
      name: "Pantry",
      glyph: "pantry",
      subtitle: null,
      tinted: false,
      position: 0,
    });
    const token = generateToken();
    await db.insert(pendingInvites).values({
      id: randomUUID(),
      roomId,
      email: "guest@example.com",
      role: "viewer",
      tokenHash: hashToken(token),
      invitedBy: inviterId,
      expiresAt: new Date(Date.now() + 86_400_000),
    });

    const res = await POST(
      jsonReq({
        name: "Guest",
        email: "guest@example.com",
        password: "hunter2hunter",
        inviteToken: token,
      }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toMatchObject({ ok: true, verified: true, emailSent: false });
    const found = await db.select().from(users).where(eq(users.email, "guest@example.com"));
    expect(found[0].emailVerifiedAt).not.toBeNull();
    const tokens = await db
      .select()
      .from(emailVerifications)
      .where(eq(emailVerifications.userId, found[0].id));
    expect(tokens).toHaveLength(0);
  });

  it("ignores an invite token for a different email", async () => {
    const inviterId = randomUUID();
    await db.insert(users).values({
      id: inviterId,
      email: "inviter@example.com",
      name: "Inviter",
      passwordHash: "x",
      emailVerifiedAt: new Date(),
    });
    await db.insert(rooms).values({
      id: "room-2",
      ownerId: inviterId,
      name: "Pantry",
      glyph: "pantry",
      subtitle: null,
      tinted: false,
      position: 0,
    });
    const token = generateToken();
    await db.insert(pendingInvites).values({
      id: randomUUID(),
      roomId: "room-2",
      email: "intended@example.com",
      role: "viewer",
      tokenHash: hashToken(token),
      invitedBy: inviterId,
      expiresAt: new Date(Date.now() + 86_400_000),
    });

    const res = await POST(
      jsonReq({
        name: "Squatter",
        email: "someone-else@example.com",
        password: "hunter2hunter",
        inviteToken: token,
      }),
    );
    const json = await res.json();
    expect(json).toMatchObject({ ok: true, verified: false });
    const found = await db.select().from(users).where(eq(users.email, "someone-else@example.com"));
    expect(found[0].emailVerifiedAt).toBeNull();
  });
});
