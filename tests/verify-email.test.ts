import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { GET, POST } from "@/app/api/verify-email/route";
import { db, users, emailVerifications } from "@/db";
import { generateToken, hashToken } from "@/lib/tokens";
import { issueVerificationToken } from "@/lib/verify-email";

function getReq(token?: string) {
  const url = token
    ? `http://localhost/api/verify-email?token=${encodeURIComponent(token)}`
    : "http://localhost/api/verify-email";
  return new NextRequest(url);
}

function postReq(body: unknown) {
  return new NextRequest("http://localhost/api/verify-email", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function createUser(opts: { email: string; verified?: boolean } = { email: "u@x.com" }) {
  const id = randomUUID();
  await db.insert(users).values({
    id,
    email: opts.email,
    name: "User",
    passwordHash: "x",
    emailVerifiedAt: opts.verified ? new Date() : null,
  });
  return id;
}

describe("GET /api/verify-email", () => {
  it("400 when token is missing", async () => {
    const res = await GET(getReq());
    expect(res.status).toBe(400);
  });

  it("400 when token is unknown", async () => {
    const res = await GET(getReq(generateToken()));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/invalid/i);
  });

  it("marks the user verified and consumes the token on success", async () => {
    const userId = await createUser({ email: "alex@example.com" });
    const token = await issueVerificationToken(userId);

    const res = await GET(getReq(token));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, email: "alex@example.com" });

    const after = await db.select().from(users).where(eq(users.id, userId));
    expect(after[0].emailVerifiedAt).not.toBeNull();

    const tokens = await db
      .select()
      .from(emailVerifications)
      .where(eq(emailVerifications.userId, userId));
    expect(tokens[0].usedAt).not.toBeNull();
  });

  it("returns ok when the user is already verified (idempotent reload)", async () => {
    const userId = await createUser({ email: "alex@example.com" });
    const token = await issueVerificationToken(userId);
    await GET(getReq(token));
    const res = await GET(getReq(token));
    expect(res.status).toBe(200);
  });

  it("rejects an expired token", async () => {
    const userId = await createUser({ email: "exp@example.com" });
    const token = generateToken();
    await db.insert(emailVerifications).values({
      id: randomUUID(),
      userId,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() - 1000),
    });
    const res = await GET(getReq(token));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/expired/i);
  });

  it("rejects a used token (when the user is not verified)", async () => {
    const userId = await createUser({ email: "used@example.com" });
    const token = generateToken();
    await db.insert(emailVerifications).values({
      id: randomUUID(),
      userId,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + 60_000),
      usedAt: new Date(),
    });
    const res = await GET(getReq(token));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/already used/i);
  });
});

describe("POST /api/verify-email (resend)", () => {
  it("400 on invalid body", async () => {
    const res = await POST(postReq({ email: "not-an-email" }));
    expect(res.status).toBe(400);
  });

  it("returns ok without leaking unknown emails", async () => {
    const res = await POST(postReq({ email: "nobody@example.com" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, sent: false });
  });

  it("returns ok (sent:false) when the user is already verified", async () => {
    await createUser({ email: "done@example.com", verified: true });
    const res = await POST(postReq({ email: "done@example.com" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, sent: false });
  });

  it("returns ok (sent:false) when email is not configured, without leaking existence", async () => {
    vi.stubEnv("SMTP_USER", "");
    vi.stubEnv("SMTP_PASS", "");
    vi.stubEnv("EMAIL_FROM", "");
    await createUser({ email: "pending@example.com" });
    const res = await POST(postReq({ email: "pending@example.com" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, sent: false });
  });
});
