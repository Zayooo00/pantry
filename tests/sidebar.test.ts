import { describe, it, expect, vi, beforeEach } from "vitest";
import { db, rooms, items, shoppingItems, users, roomMembers } from "@/db";

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => ({ user: { id: "u1", name: "Alex", email: "alex@example.com" } })),
}));

import { GET } from "@/app/api/sidebar/route";

beforeEach(async () => {
  await db.insert(users).values([
    { id: "u1", email: "alex@example.com", name: "Alex", passwordHash: "x" },
    { id: "u2", email: "b@example.com", name: "B", passwordHash: "x" },
  ]);
});

describe("GET /api/sidebar", () => {
  it("returns rooms ordered by position with item counts and 'low' tally", async () => {
    await db.insert(rooms).values([
      { id: "r2", ownerId: "u1", name: "Fridge", glyph: "❄️", position: 1 },
      { id: "r1", ownerId: "u1", name: "Pantry", glyph: "🥫", position: 0 },
    ]);
    await db.insert(items).values([
      { id: "i1", roomId: "r1", name: "Salt", unit: "g", count: 0, threshold: 100 },
      { id: "i2", roomId: "r1", name: "Pepper", unit: "g", count: 500, threshold: 100 },
      { id: "i3", roomId: "r2", name: "Milk", unit: "L", count: 2 },
    ]);
    await db.insert(shoppingItems).values([
      { id: "s1", userId: "u1", name: "Bread", quantity: 1, unit: "loaf", done: false },
      { id: "s2", userId: "u1", name: "Eggs", quantity: 12, unit: "ct", done: true },
    ]);

    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();

    expect(json.rooms[0].id).toBe("r1");
    expect(json.rooms[1].id).toBe("r2");
    expect(json.rooms[0].count).toBe(2);
    expect(json.rooms[0].low).toBe(1);
    expect(json.rooms[0].role).toBe("owner");
    expect(json.rooms[1].count).toBe(1);
    expect(json.rooms[1].low).toBe(0);
    expect(json.shoppingCount).toBe(1);
  });

  it("excludes rooms not owned by or shared with the current user", async () => {
    await db.insert(rooms).values([
      { id: "mine", ownerId: "u1", name: "Mine", glyph: "🥫", position: 0 },
      { id: "theirs", ownerId: "u2", name: "Theirs", glyph: "❄️", position: 0 },
    ]);
    const res = await GET();
    const json = await res.json();
    expect(json.rooms.map((r: { id: string }) => r.id)).toEqual(["mine"]);
  });

  it("includes shared rooms with the member's role", async () => {
    await db.insert(rooms).values({
      id: "shared",
      ownerId: "u2",
      name: "Shared",
      glyph: "❄️",
      position: 0,
    });
    await db.insert(roomMembers).values({
      id: "m1",
      roomId: "shared",
      userId: "u1",
      role: "viewer",
      invitedBy: "u2",
    });
    const res = await GET();
    const json = await res.json();
    expect(json.rooms).toHaveLength(1);
    expect(json.rooms[0].id).toBe("shared");
    expect(json.rooms[0].role).toBe("viewer");
  });

  it("scopes shoppingCount to the current user", async () => {
    await db.insert(shoppingItems).values([
      { id: "s1", userId: "u1", name: "Bread", quantity: 1, unit: "loaf", done: false },
      { id: "s2", userId: "u2", name: "Theirs", quantity: 1, unit: "ea", done: false },
    ]);
    const res = await GET();
    const json = await res.json();
    expect(json.shoppingCount).toBe(1);
  });
});
