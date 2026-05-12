import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { db, users } from "@/db";

const sessionMock = vi.hoisted(() => ({
  value: { user: { id: "u1", name: "Alex", email: "alex@example.com" } } as {
    user: { id: string; name: string; email: string };
  } | null,
}));

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => sessionMock.value),
}));

import { POST } from "@/app/api/upload/route";

const PNG_HEAD = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const HTML_LIKE = new Uint8Array(
  [...'<svg xmlns="http://www.w3.org/2000/svg"><script>'].map((c) => c.charCodeAt(0)),
);
const TEXT_BYTES = new Uint8Array([..."hello there"].map((c) => c.charCodeAt(0)));

function uploadReq(file: Blob, filename: string, type: string): NextRequest {
  const fd = new FormData();
  fd.append("file", new File([file], filename, { type }));
  return new NextRequest("http://l/api/upload", { method: "POST", body: fd });
}

beforeEach(async () => {
  sessionMock.value = { user: { id: "u1", name: "Alex", email: "alex@example.com" } };
  vi.stubEnv("E2E_BLOB_LOCAL", "1");
  await db
    .insert(users)
    .values({ id: "u1", email: "alex@example.com", name: "Alex", passwordHash: "x" });
});

describe("POST /api/upload", () => {
  it("401s when not signed in", async () => {
    sessionMock.value = null;
    const res = await POST(uploadReq(new Blob([PNG_HEAD]), "p.png", "image/png"));
    expect(res.status).toBe(401);
  });

  it("rejects image/svg+xml even when bytes look like SVG", async () => {
    const res = await POST(uploadReq(new Blob([HTML_LIKE]), "evil.svg", "image/svg+xml") as never);
    expect(res.status).toBe(400);
  });

  it("rejects non-image bytes mislabeled as image/png", async () => {
    const res = await POST(uploadReq(new Blob([TEXT_BYTES]), "fake.png", "image/png"));
    expect(res.status).toBe(400);
  });

  it("rejects SVG bytes mislabeled as image/png", async () => {
    const res = await POST(uploadReq(new Blob([HTML_LIKE]), "evil.png", "image/png"));
    expect(res.status).toBe(400);
  });

  it("accepts a real PNG and returns a path scoped to the requester's user id", async () => {
    const res = await POST(uploadReq(new Blob([PNG_HEAD]), "ok.png", "image/png"));
    expect(res.status).toBe(200);
    const json = (await res.json()) as { url: string };
    expect(json.url).toMatch(/^\/api\/photos\/items\/u1\/[a-f0-9-]+-ok\.png$/);
  });

  it("sanitizes the filename extension", async () => {
    const res = await POST(uploadReq(new Blob([PNG_HEAD]), "ok.png/../evil", "image/png") as never);
    expect(res.status).toBe(200);
    const json = (await res.json()) as { url: string };
    expect(json.url).not.toContain("..");
    expect(json.url).not.toContain("/evil");
  });
});
