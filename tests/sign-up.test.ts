import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { POST } from "@/app/api/sign-up/route";
import { db, users } from "@/db";
import { verifyPassword } from "@/lib/password";

function jsonReq(body: unknown) {
  return new NextRequest("http://localhost/api/sign-up", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/sign-up", () => {
  it("creates a user and stores a verifiable password hash", async () => {
    const res = await POST(
      jsonReq({ name: "Alex", email: "alex@example.com", password: "hunter2hunter" }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ ok: true });

    const found = await db.select().from(users).where(eq(users.email, "alex@example.com"));
    expect(found).toHaveLength(1);
    expect(found[0].name).toBe("Alex");
    expect(found[0].passwordHash).not.toBe("hunter2hunter");
    expect(await verifyPassword("hunter2hunter", found[0].passwordHash)).toBe(true);
    expect(await verifyPassword("wrongpass", found[0].passwordHash)).toBe(false);
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

  it("reproduces the user's failing payload (test@test.pl with 12-char password)", async () => {
    const res = await POST(
      jsonReq({ name: "test@test.pl", email: "test@test.pl", password: "test@test.pl" }),
    );
    expect(res.status).toBe(200);
  });
});
