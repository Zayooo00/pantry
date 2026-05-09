import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db, pendingInvites, rooms, roomMembers, users } from "@/db";

const sessionMock = vi.hoisted(() => ({
  value: { user: { id: "u1", name: "Owner", email: "owner@example.com" } } as
    | { user: { id: string; name: string; email: string } }
    | null,
}));

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => sessionMock.value),
}));

const sendMailMock = vi.hoisted(() =>
  vi.fn<(opts: { to?: string | string[] }) => Promise<{ messageId: string }>>(
    async () => ({ messageId: "msg_1" }),
  ),
);

vi.mock("nodemailer", () => ({
  default: { createTransport: () => ({ sendMail: sendMailMock }) },
  createTransport: () => ({ sendMail: sendMailMock }),
}));

beforeEach(() => {
  sendMailMock.mockClear();
  vi.stubEnv("SMTP_USER", "pantry@example.com");
  vi.stubEnv("SMTP_PASS", "test-app-password");
  vi.stubEnv("EMAIL_FROM", "Pantry <pantry@example.com>");
  vi.stubEnv("APP_URL", "http://localhost:3000");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

import { GET as listMembers, POST as inviteMember } from "@/app/api/rooms/[id]/members/route";
import {
  PATCH as patchMember,
  DELETE as deleteMember,
} from "@/app/api/rooms/[id]/members/[userId]/route";
import { GET as getShared } from "@/app/api/me/shared/route";

function jsonReq(url: string, method: string, body: unknown) {
  return new NextRequest(url, {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function roomParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

function memberParams(id: string, userId: string) {
  return { params: Promise.resolve({ id, userId }) };
}

beforeEach(async () => {
  sessionMock.value = { user: { id: "u1", name: "Owner", email: "owner@example.com" } };
  await db.insert(users).values([
    { id: "u1", email: "owner@example.com", name: "Owner", passwordHash: "x" },
    { id: "u2", email: "guest@example.com", name: "Guest", passwordHash: "x" },
    { id: "u3", email: "third@example.com", name: "Third", passwordHash: "x" },
  ]);
  await db.insert(rooms).values({ id: "r1", ownerId: "u1", name: "Pantry", glyph: "🥫" });
});

describe("POST /api/rooms/[id]/members", () => {
  it("invites an existing user by email", async () => {
    const res = await inviteMember(
      jsonReq("http://l/api/rooms/r1/members", "POST", {
        email: "guest@example.com",
        role: "viewer",
      }),
      roomParams("r1"),
    );
    expect(res.status).toBe(200);
    const all = await db.select().from(roomMembers).where(eq(roomMembers.roomId, "r1"));
    expect(all).toHaveLength(1);
    expect(all[0].userId).toBe("u2");
    expect(all[0].role).toBe("viewer");
    expect(all[0].invitedBy).toBe("u1");
  });

  it("creates a pending invite and emails the address when not registered", async () => {
    const res = await inviteMember(
      jsonReq("http://l/api/rooms/r1/members", "POST", {
        email: "stranger@example.com",
        role: "editor",
      }),
      roomParams("r1"),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.pending).toEqual({ email: "stranger@example.com", role: "editor" });
    const invites = await db
      .select()
      .from(pendingInvites)
      .where(eq(pendingInvites.email, "stranger@example.com"));
    expect(invites).toHaveLength(1);
    expect(invites[0].roomId).toBe("r1");
    expect(invites[0].role).toBe("editor");
    expect(invites[0].invitedBy).toBe("u1");
    expect(invites[0].acceptedAt).toBeNull();
    expect(sendMailMock).toHaveBeenCalledTimes(1);
    expect(sendMailMock.mock.calls[0][0].to).toBe("stranger@example.com");
  });

  it("503s on pending invite when email isn't configured", async () => {
    vi.stubEnv("SMTP_USER", "");
    vi.stubEnv("SMTP_PASS", "");
    vi.stubEnv("EMAIL_FROM", "");
    const res = await inviteMember(
      jsonReq("http://l/api/rooms/r1/members", "POST", {
        email: "stranger@example.com",
        role: "viewer",
      }),
      roomParams("r1"),
    );
    expect(res.status).toBe(503);
    expect(await db.select().from(pendingInvites)).toHaveLength(0);
  });

  it("upserts an existing pending invite with a fresh token", async () => {
    await db.insert(pendingInvites).values({
      id: "p1",
      roomId: "r1",
      email: "stranger@example.com",
      role: "viewer",
      tokenHash: "old",
      invitedBy: "u1",
      expiresAt: new Date(Date.now() + 1000),
    });
    const res = await inviteMember(
      jsonReq("http://l/api/rooms/r1/members", "POST", {
        email: "stranger@example.com",
        role: "editor",
      }),
      roomParams("r1"),
    );
    expect(res.status).toBe(200);
    const all = await db.select().from(pendingInvites);
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe("p1");
    expect(all[0].role).toBe("editor");
    expect(all[0].tokenHash).not.toBe("old");
  });

  it("409s when the user is already a member", async () => {
    await db.insert(roomMembers).values({
      id: "m1",
      roomId: "r1",
      userId: "u2",
      role: "viewer",
      invitedBy: "u1",
    });
    const res = await inviteMember(
      jsonReq("http://l/api/rooms/r1/members", "POST", {
        email: "guest@example.com",
        role: "editor",
      }),
      roomParams("r1"),
    );
    expect(res.status).toBe(409);
  });

  it("403s when caller isn't the owner", async () => {
    sessionMock.value = { user: { id: "u3", name: "Third", email: "third@example.com" } };
    const res = await inviteMember(
      jsonReq("http://l/api/rooms/r1/members", "POST", {
        email: "guest@example.com",
        role: "viewer",
      }),
      roomParams("r1"),
    );
    expect(res.status).toBe(403);
  });
});

describe("PATCH /api/rooms/[id]/members/[userId]", () => {
  it("updates the role", async () => {
    await db.insert(roomMembers).values({
      id: "m1",
      roomId: "r1",
      userId: "u2",
      role: "viewer",
      invitedBy: "u1",
    });
    const res = await patchMember(
      jsonReq("http://l/api/rooms/r1/members/u2", "PATCH", { role: "editor" }),
      memberParams("r1", "u2"),
    );
    expect(res.status).toBe(200);
    const found = await db
      .select()
      .from(roomMembers)
      .where(eq(roomMembers.id, "m1"));
    expect(found[0].role).toBe("editor");
  });
});

describe("DELETE /api/rooms/[id]/members/[userId]", () => {
  it("lets the owner revoke another member", async () => {
    await db.insert(roomMembers).values({
      id: "m1",
      roomId: "r1",
      userId: "u2",
      role: "viewer",
      invitedBy: "u1",
    });
    const res = await deleteMember(
      new NextRequest("http://l/api/rooms/r1/members/u2", { method: "DELETE" }),
      memberParams("r1", "u2"),
    );
    expect(res.status).toBe(200);
    expect(await db.select().from(roomMembers)).toHaveLength(0);
  });

  it("lets a member revoke themselves (leave)", async () => {
    await db.insert(roomMembers).values({
      id: "m1",
      roomId: "r1",
      userId: "u2",
      role: "viewer",
      invitedBy: "u1",
    });
    sessionMock.value = { user: { id: "u2", name: "Guest", email: "guest@example.com" } };
    const res = await deleteMember(
      new NextRequest("http://l/api/rooms/r1/members/u2", { method: "DELETE" }),
      memberParams("r1", "u2"),
    );
    expect(res.status).toBe(200);
    expect(await db.select().from(roomMembers)).toHaveLength(0);
  });

  it("forbids one member from removing another", async () => {
    await db.insert(roomMembers).values([
      { id: "m1", roomId: "r1", userId: "u2", role: "viewer", invitedBy: "u1" },
      { id: "m2", roomId: "r1", userId: "u3", role: "viewer", invitedBy: "u1" },
    ]);
    sessionMock.value = { user: { id: "u3", name: "Third", email: "third@example.com" } };
    const res = await deleteMember(
      new NextRequest("http://l/api/rooms/r1/members/u2", { method: "DELETE" }),
      memberParams("r1", "u2"),
    );
    expect(res.status).toBe(403);
  });
});

describe("GET /api/rooms/[id]/members", () => {
  it("returns owner + members for the current user", async () => {
    await db.insert(roomMembers).values({
      id: "m1",
      roomId: "r1",
      userId: "u2",
      role: "editor",
      invitedBy: "u1",
    });
    const res = await listMembers(
      new NextRequest("http://l/api/rooms/r1/members"),
      roomParams("r1"),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.owner.id).toBe("u1");
    expect(json.members).toHaveLength(1);
    expect(json.members[0].userId).toBe("u2");
    expect(json.isOwner).toBe(true);
  });

  it("returns 404 when the user can't view the room", async () => {
    sessionMock.value = { user: { id: "u3", name: "Third", email: "third@example.com" } };
    const res = await listMembers(
      new NextRequest("http://l/api/rooms/r1/members"),
      roomParams("r1"),
    );
    expect(res.status).toBe(404);
  });
});

describe("GET /api/me/shared", () => {
  it("returns rooms shared with me and rooms I share", async () => {
    await db.insert(rooms).values([
      { id: "r2", ownerId: "u2", name: "Their kitchen", glyph: "🍳" },
    ]);
    await db.insert(roomMembers).values([
      { id: "m1", roomId: "r2", userId: "u1", role: "viewer", invitedBy: "u2" },
      { id: "m2", roomId: "r1", userId: "u3", role: "editor", invitedBy: "u1" },
    ]);
    const res = await getShared();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.sharedWithMe).toHaveLength(1);
    expect(json.sharedWithMe[0].roomId).toBe("r2");
    expect(json.sharedWithMe[0].ownerEmail).toBe("guest@example.com");
    expect(json.iShare).toHaveLength(1);
    expect(json.iShare[0].roomId).toBe("r1");
    expect(json.iShare[0].members).toHaveLength(1);
    expect(json.iShare[0].members[0].userId).toBe("u3");
  });
});
