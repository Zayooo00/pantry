import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";

const sendMailMock = vi.hoisted(() =>
  vi.fn<(opts: { to?: string | string[] }) => Promise<{ messageId: string }>>(async () => ({
    messageId: "msg_1",
  })),
);

vi.mock("nodemailer", () => ({
  default: { createTransport: () => ({ sendMail: sendMailMock }) },
  createTransport: () => ({ sendMail: sendMailMock }),
}));

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
  beforeEach(() => {
    vi.stubEnv("SMTP_USER", "pantry@example.com");
    vi.stubEnv("SMTP_PASS", "test-app-password");
    vi.stubEnv("EMAIL_FROM", "Pantry <pantry@example.com>");
  });

  it("400 on invalid body", async () => {
    const res = await POST(postReq({ email: "not-an-email" }));
    expect(res.status).toBe(400);
  });

  it("returns the same body for unknown emails, verified users, and pending users", async () => {
    await createUser({ email: "done@example.com", verified: true });
    const unknown = await POST(postReq({ email: "nobody@example.com" }));
    const verified = await POST(postReq({ email: "done@example.com" }));
    expect(unknown.status).toBe(200);
    expect(verified.status).toBe(200);
    const unknownBody = await unknown.json();
    const verifiedBody = await verified.json();
    expect(unknownBody).toEqual({ ok: true });
    expect(verifiedBody).toEqual({ ok: true });
    expect(unknownBody).toEqual(verifiedBody);
  });

  it("returns ok immediately for an unverified user (send is deferred)", async () => {
    await createUser({ email: "pending@example.com" });
    const res = await POST(postReq({ email: "pending@example.com" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it("503s when SMTP isn't configured, regardless of whether the email exists", async () => {
    vi.stubEnv("SMTP_USER", "");
    vi.stubEnv("SMTP_PASS", "");
    vi.stubEnv("EMAIL_FROM", "");
    await createUser({ email: "pending@example.com" });
    const existing = await POST(postReq({ email: "pending@example.com" }));
    expect(existing.status).toBe(503);
    const unknown = await POST(postReq({ email: "nobody-here@example.com" }));
    expect(unknown.status).toBe(503);
  });
});
