import { describe, it, expect, vi, beforeEach } from "vitest";
import { db, rooms, items, itemEvents, users } from "@/db";

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => ({ user: { id: "u1", name: "Alex", email: "alex@example.com" } })),
}));

import { GET } from "@/app/api/activity/route";

beforeEach(async () => {
  await db.insert(users).values([
    { id: "u1", email: "alex@example.com", name: "Alex", passwordHash: "x" },
    { id: "u2", email: "b@example.com", name: "B", passwordHash: "x" },
  ]);
});

describe("GET /api/activity", () => {
  it("returns enriched events newest-first with item and room metadata", async () => {
    await db.insert(rooms).values({ id: "r1", ownerId: "u1", name: "Pantry", glyph: "🥫" });
    await db.insert(items).values({ id: "i1", roomId: "r1", name: "Salt", unit: "g", count: 100 });
    await db.insert(itemEvents).values([
      { id: "e1", itemId: "i1", kind: "created", countAfter: 100, createdAt: new Date(2026, 0, 1) },
      { id: "e2", itemId: "i1", kind: "consume", delta: -10, countAfter: 90, createdAt: new Date(2026, 0, 2) },
    ]);

    const res = await GET(new Request("http://localhost/api/activity") as never);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.events).toHaveLength(2);
    expect(json.events[0].id).toBe("e2");
    expect(json.events[0].itemName).toBe("Salt");
    expect(json.events[0].roomName).toBe("Pantry");
    expect(json.events[0].roomGlyph).toBe("🥫");
  });

  it("excludes events for items in rooms the user can't access", async () => {
    await db.insert(rooms).values([
      { id: "mine", ownerId: "u1", name: "Mine", glyph: "🥫" },
      { id: "theirs", ownerId: "u2", name: "Theirs", glyph: "❄️" },
    ]);
    await db.insert(items).values([
      { id: "i1", roomId: "mine", name: "Salt", unit: "g", count: 100 },
      { id: "i2", roomId: "theirs", name: "Milk", unit: "L", count: 1 },
    ]);
    await db.insert(itemEvents).values([
      { id: "e1", itemId: "i1", kind: "created" },
      { id: "e2", itemId: "i2", kind: "created" },
    ]);
    const res = await GET(new Request("http://localhost/api/activity") as never);
    const json = await res.json();
    expect(json.events.map((e: { id: string }) => e.id)).toEqual(["e1"]);
  });
});
