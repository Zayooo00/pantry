import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db, rooms, items, users, roomMembers } from "@/db";

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => ({ user: { id: "u1", name: "Alex", email: "alex@example.com" } })),
}));

import { POST as createRoom } from "@/app/api/rooms/route";
import { PATCH as patchRoom, DELETE as deleteRoom } from "@/app/api/rooms/[id]/route";
import { POST as reorderRooms } from "@/app/api/rooms/reorder/route";

function jsonReq(url: string, method: string, body: unknown) {
  return new NextRequest(url, {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function idParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

beforeEach(async () => {
  await db.insert(users).values({
    id: "u1",
    email: "alex@example.com",
    name: "Alex",
    passwordHash: "x",
  });
});

describe("POST /api/rooms", () => {
  it("creates a room owned by the session user with sequential position", async () => {
    const r1 = await createRoom(
      jsonReq("http://l/api/rooms", "POST", { name: "Pantry", glyph: "🥫" }),
    );
    expect(r1.status).toBe(200);
    const r2 = await createRoom(
      jsonReq("http://l/api/rooms", "POST", { name: "Fridge", glyph: "❄️" }),
    );
    expect(r2.status).toBe(200);

    const all = await db.select().from(rooms);
    expect(all).toHaveLength(2);
    const positions = all.map((r) => r.position).sort();
    expect(positions).toEqual([0, 1]);
    expect(all.every((r) => r.ownerId === "u1")).toBe(true);
  });

  it("rejects missing fields", async () => {
    const res = await createRoom(jsonReq("http://l/api/rooms", "POST", { name: "Pantry" }));
    expect(res.status).toBe(400);
  });
});

describe("PATCH /api/rooms/[id]", () => {
  it("updates the provided fields when the user owns the room", async () => {
    await db.insert(rooms).values({ id: "r1", ownerId: "u1", name: "Pantry", glyph: "🥫" });
    const res = await patchRoom(
      jsonReq("http://l/api/rooms/r1", "PATCH", { name: "Larder", tinted: true }),
      idParams("r1"),
    );
    expect(res.status).toBe(200);
    const found = await db.select().from(rooms).where(eq(rooms.id, "r1"));
    expect(found[0].name).toBe("Larder");
    expect(found[0].tinted).toBe(true);
  });

  it("returns 403 when the user is neither owner nor editor", async () => {
    await db
      .insert(users)
      .values({ id: "u2", email: "b@example.com", name: "B", passwordHash: "x" });
    await db.insert(rooms).values({ id: "r1", ownerId: "u2", name: "Pantry", glyph: "🥫" });
    const res = await patchRoom(
      jsonReq("http://l/api/rooms/r1", "PATCH", { name: "X" }),
      idParams("r1"),
    );
    expect(res.status).toBe(403);
  });

  it("allows editor members to patch the room", async () => {
    await db
      .insert(users)
      .values({ id: "u2", email: "b@example.com", name: "B", passwordHash: "x" });
    await db.insert(rooms).values({ id: "r1", ownerId: "u2", name: "Pantry", glyph: "🥫" });
    await db.insert(roomMembers).values({
      id: "m1",
      roomId: "r1",
      userId: "u1",
      role: "editor",
      invitedBy: "u2",
    });
    const res = await patchRoom(
      jsonReq("http://l/api/rooms/r1", "PATCH", { name: "Larder" }),
      idParams("r1"),
    );
    expect(res.status).toBe(200);
  });
});

describe("DELETE /api/rooms/[id]", () => {
  it("deletes an empty room owned by the session user", async () => {
    await db.insert(rooms).values({ id: "r1", ownerId: "u1", name: "Pantry", glyph: "🥫" });
    const res = await deleteRoom(
      new NextRequest("http://l/api/rooms/r1", { method: "DELETE" }),
      idParams("r1"),
    );
    expect(res.status).toBe(200);
    expect(await db.select().from(rooms)).toHaveLength(0);
  });

  it("refuses to delete a room that still has items", async () => {
    await db.insert(rooms).values({ id: "r1", ownerId: "u1", name: "Pantry", glyph: "🥫" });
    await db.insert(items).values({ id: "i1", roomId: "r1", name: "Salt", unit: "g", count: 1 });
    const res = await deleteRoom(
      new NextRequest("http://l/api/rooms/r1", { method: "DELETE" }),
      idParams("r1"),
    );
    expect(res.status).toBe(409);
    expect(await db.select().from(rooms)).toHaveLength(1);
  });

  it("refuses to delete when the user is only an editor (not owner)", async () => {
    await db
      .insert(users)
      .values({ id: "u2", email: "b@example.com", name: "B", passwordHash: "x" });
    await db.insert(rooms).values({ id: "r1", ownerId: "u2", name: "Pantry", glyph: "🥫" });
    await db.insert(roomMembers).values({
      id: "m1",
      roomId: "r1",
      userId: "u1",
      role: "editor",
      invitedBy: "u2",
    });
    const res = await deleteRoom(
      new NextRequest("http://l/api/rooms/r1", { method: "DELETE" }),
      idParams("r1"),
    );
    expect(res.status).toBe(403);
    expect(await db.select().from(rooms)).toHaveLength(1);
  });
});

describe("POST /api/rooms/reorder", () => {
  it("reassigns position based on supplied order, ignoring rooms not owned by the user", async () => {
    await db.insert(rooms).values([
      { id: "r1", ownerId: "u1", name: "A", glyph: "A", position: 0 },
      { id: "r2", ownerId: "u1", name: "B", glyph: "B", position: 1 },
      { id: "r3", ownerId: "u1", name: "C", glyph: "C", position: 2 },
    ]);

    const res = await reorderRooms(
      jsonReq("http://l/api/rooms/reorder", "POST", { order: ["r3", "r1", "r2"] }),
    );
    expect(res.status).toBe(200);

    const all = await db.select().from(rooms);
    expect(all.find((r) => r.id === "r3")!.position).toBe(0);
    expect(all.find((r) => r.id === "r1")!.position).toBe(1);
    expect(all.find((r) => r.id === "r2")!.position).toBe(2);
  });
});
