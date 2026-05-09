import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { db, rooms, items, users } from "@/db";

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => ({ user: { id: "u1", name: "Alex", email: "alex@example.com" } })),
}));

import { GET } from "@/app/api/search/route";

beforeEach(async () => {
  await db.insert(users).values([
    { id: "u1", email: "alex@example.com", name: "Alex", passwordHash: "x" },
    { id: "u2", email: "b@example.com", name: "B", passwordHash: "x" },
  ]);
  await db.insert(rooms).values({ id: "r1", ownerId: "u1", name: "Pantry", glyph: "🥫" });
  await db.insert(items).values([
    {
      id: "i1",
      roomId: "r1",
      name: "Olive oil",
      brand: "Filippo",
      category: "oil",
      unit: "bottles",
      count: 1,
    },
    {
      id: "i2",
      roomId: "r1",
      name: "Sea salt",
      brand: "Maldon",
      category: "spice",
      unit: "g",
      count: 100,
    },
    {
      id: "i3",
      roomId: "r1",
      name: "Black pepper",
      brand: null,
      category: "spice",
      unit: "g",
      count: 50,
    },
  ]);
});

describe("GET /api/search", () => {
  it("matches name (case-insensitive)", async () => {
    const res = await GET(new NextRequest("http://l/api/search?q=OLIVE"));
    const json = await res.json();
    expect(json.items.map((i: { id: string }) => i.id)).toEqual(["i1"]);
  });

  it("matches brand", async () => {
    const res = await GET(new NextRequest("http://l/api/search?q=maldon"));
    const json = await res.json();
    expect(json.items.map((i: { id: string }) => i.id)).toEqual(["i2"]);
  });

  it("matches category", async () => {
    const res = await GET(new NextRequest("http://l/api/search?q=spice"));
    const json = await res.json();
    expect(json.items.map((i: { id: string }) => i.id).sort()).toEqual(["i2", "i3"]);
  });

  it("returns empty array for empty query", async () => {
    const res = await GET(new NextRequest("http://l/api/search?q="));
    const json = await res.json();
    expect(json.items).toEqual([]);
  });

  it("excludes items from rooms the user can't access", async () => {
    await db.insert(rooms).values({ id: "r2", ownerId: "u2", name: "Theirs", glyph: "❄️" });
    await db.insert(items).values({
      id: "iX",
      roomId: "r2",
      name: "Olive jam",
      brand: null,
      category: null,
      unit: "jar",
      count: 1,
    });
    const res = await GET(new NextRequest("http://l/api/search?q=olive"));
    const json = await res.json();
    expect(json.items.map((i: { id: string }) => i.id)).toEqual(["i1"]);
  });
});
