import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db, notifications, pendingInvites, rooms, roomMembers, users } from "@/db";
import { hashToken } from "@/lib/tokens";

const sessionMock = vi.hoisted(() => ({
  value: { user: { id: "u1", name: "Owner", email: "owner@example.com" } } as {
    user: { id: string; name: string; email: string };
  } | null,
}));

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => sessionMock.value),
}));

const sendMailMock = vi.hoisted(() =>
  vi.fn<(opts: { to?: string | string[] }) => Promise<{ messageId: string }>>(async () => ({
    messageId: "msg_1",
  })),
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
import { POST as acceptInvite } from "@/app/api/invites/[token]/route";

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

function tokenParams(token: string) {
  return { params: Promise.resolve({ token }) };
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
  it("creates a pending invite + email + in-app notification when invitee is registered", async () => {
    const res = await inviteMember(
      jsonReq("http://l/api/rooms/r1/members", "POST", {
        email: "guest@example.com",
        role: "viewer",
      }),
      roomParams("r1"),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.pending).toEqual({
      email: "guest@example.com",
      role: "viewer",
      registered: true,
    });
    expect(await db.select().from(roomMembers).where(eq(roomMembers.roomId, "r1"))).toHaveLength(0);
    const invites = await db
      .select()
      .from(pendingInvites)
      .where(eq(pendingInvites.email, "guest@example.com"));
    expect(invites).toHaveLength(1);
    expect(invites[0].role).toBe("viewer");
    expect(invites[0].acceptedAt).toBeNull();
    expect(sendMailMock).toHaveBeenCalledTimes(1);
    expect(sendMailMock.mock.calls[0][0].to).toBe("guest@example.com");
    const notes = await db.select().from(notifications).where(eq(notifications.userId, "u2"));
    expect(notes).toHaveLength(1);
    expect(notes[0].kind).toBe("invite_received");
    expect(notes[0].link).toMatch(/^\/invite\//);
    expect(notes[0].roomId).toBe("r1");
  });

  it("still notifies registered invitees in-app when SMTP isn't configured", async () => {
    vi.stubEnv("SMTP_USER", "");
    vi.stubEnv("SMTP_PASS", "");
    vi.stubEnv("EMAIL_FROM", "");
    const res = await inviteMember(
      jsonReq("http://l/api/rooms/r1/members", "POST", {
        email: "guest@example.com",
        role: "editor",
      }),
      roomParams("r1"),
    );
    expect(res.status).toBe(200);
    expect(sendMailMock).not.toHaveBeenCalled();
    expect(await db.select().from(pendingInvites)).toHaveLength(1);
    const notes = await db.select().from(notifications).where(eq(notifications.userId, "u2"));
    expect(notes).toHaveLength(1);
    expect(notes[0].kind).toBe("invite_received");
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
    expect(json.pending).toEqual({
      email: "stranger@example.com",
      role: "editor",
      registered: false,
    });
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
    expect(await db.select().from(notifications)).toHaveLength(0);
  });

  it("503s on pending invite when email isn't configured and invitee is unregistered", async () => {
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
    const found = await db.select().from(roomMembers).where(eq(roomMembers.id, "m1"));
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

describe("POST /api/invites/[token] (accept)", () => {
  async function seedInvite(opts: {
    token: string;
    email: string;
    role?: "viewer" | "editor";
    expiresAt?: Date;
  }) {
    await db.insert(pendingInvites).values({
      id: "p1",
      roomId: "r1",
      email: opts.email,
      role: opts.role ?? "viewer",
      tokenHash: hashToken(opts.token),
      invitedBy: "u1",
      expiresAt: opts.expiresAt ?? new Date(Date.now() + 60_000),
    });
  }

  it("adds the invitee as a member and notifies the inviter", async () => {
    await seedInvite({ token: "tok-good", email: "guest@example.com", role: "editor" });
    sessionMock.value = { user: { id: "u2", name: "Guest", email: "guest@example.com" } };
    const res = await acceptInvite(
      new NextRequest("http://l/api/invites/tok-good", { method: "POST" }),
      tokenParams("tok-good"),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ ok: true, roomId: "r1" });

    const members = await db.select().from(roomMembers).where(eq(roomMembers.roomId, "r1"));
    expect(members).toHaveLength(1);
    expect(members[0].userId).toBe("u2");
    expect(members[0].role).toBe("editor");

    const updatedInvite = await db.select().from(pendingInvites).where(eq(pendingInvites.id, "p1"));
    expect(updatedInvite[0].acceptedAt).not.toBeNull();

    const inviterNotes = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, "u1"));
    expect(inviterNotes).toHaveLength(1);
    expect(inviterNotes[0].kind).toBe("invite_accepted");
    expect(inviterNotes[0].link).toBe("/rooms/r1");
    expect(inviterNotes[0].roomId).toBe("r1");
    expect(inviterNotes[0].title).toContain("Guest");
    expect(inviterNotes[0].title).toContain("Pantry");
  });

  it("auto-verifies the invitee if they signed up but never confirmed their email", async () => {
    await db.update(users).set({ emailVerifiedAt: null }).where(eq(users.id, "u2"));
    await seedInvite({ token: "tok-verify", email: "guest@example.com" });
    sessionMock.value = { user: { id: "u2", name: "Guest", email: "guest@example.com" } };
    const res = await acceptInvite(
      new NextRequest("http://l/api/invites/tok-verify", { method: "POST" }),
      tokenParams("tok-verify"),
    );
    expect(res.status).toBe(200);
    const after = await db.select().from(users).where(eq(users.id, "u2"));
    expect(after[0].emailVerifiedAt).not.toBeNull();
  });

  it("rejects when the signed-in account doesn't match the invite email", async () => {
    await seedInvite({ token: "tok-mismatch", email: "guest@example.com" });
    sessionMock.value = { user: { id: "u3", name: "Third", email: "third@example.com" } };
    const res = await acceptInvite(
      new NextRequest("http://l/api/invites/tok-mismatch", { method: "POST" }),
      tokenParams("tok-mismatch"),
    );
    expect(res.status).toBe(403);
    expect(await db.select().from(roomMembers)).toHaveLength(0);
    expect(await db.select().from(notifications)).toHaveLength(0);
  });

  it("rejects an expired invite", async () => {
    await seedInvite({
      token: "tok-old",
      email: "guest@example.com",
      expiresAt: new Date(Date.now() - 1000),
    });
    sessionMock.value = { user: { id: "u2", name: "Guest", email: "guest@example.com" } };
    const res = await acceptInvite(
      new NextRequest("http://l/api/invites/tok-old", { method: "POST" }),
      tokenParams("tok-old"),
    );
    expect(res.status).toBe(410);
    expect(await db.select().from(roomMembers)).toHaveLength(0);
  });

  it("rejects a re-accept attempt", async () => {
    await seedInvite({ token: "tok-twice", email: "guest@example.com" });
    sessionMock.value = { user: { id: "u2", name: "Guest", email: "guest@example.com" } };
    const first = await acceptInvite(
      new NextRequest("http://l/api/invites/tok-twice", { method: "POST" }),
      tokenParams("tok-twice"),
    );
    expect(first.status).toBe(200);
    const second = await acceptInvite(
      new NextRequest("http://l/api/invites/tok-twice", { method: "POST" }),
      tokenParams("tok-twice"),
    );
    expect(second.status).toBe(409);
  });
});

describe("GET /api/me/shared", () => {
  it("returns rooms shared with me and rooms I share", async () => {
    await db
      .insert(rooms)
      .values([{ id: "r2", ownerId: "u2", name: "Their kitchen", glyph: "🍳" }]);
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
