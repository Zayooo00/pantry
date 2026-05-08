import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db, rooms, items, shoppingItems, users } from "@/db";

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => ({ user: { id: "u1", name: "Alex", email: "alex@example.com" } })),
}));

import { POST as createShopping } from "@/app/api/shopping/route";
import { PATCH as patchShopping, DELETE as deleteShopping } from "@/app/api/shopping/[id]/route";
import { POST as clearDone } from "@/app/api/shopping/clear-done/route";

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
  await db.insert(users).values({ id: "u1", email: "alex@example.com", name: "Alex", passwordHash: "x" });
  await db.insert(rooms).values({ id: "r1", ownerId: "u1", name: "Pantry", glyph: "🥫" });
});

describe("POST /api/shopping (manual)", () => {
  it("adds a manual entry with default group/reason scoped to the current user", async () => {
    const res = await createShopping(jsonReq("http://l/api/shopping", "POST", {
      name: "Bread",
      quantity: 1,
      unit: "loaf",
    }));
    expect(res.status).toBe(200);

    const all = await db.select().from(shoppingItems);
    expect(all).toHaveLength(1);
    expect(all[0].name).toBe("Bread");
    expect(all[0].userId).toBe("u1");
    expect(all[0].groupName).toBe("Other");
    expect(all[0].reason).toBe("MANUAL");
    expect(all[0].source).toBe("manual");
  });

  it("rejects missing name", async () => {
    const res = await createShopping(jsonReq("http://l/api/shopping", "POST", { quantity: 1, unit: "g" }));
    expect(res.status).toBe(400);
  });
});

describe("POST /api/shopping (from item)", () => {
  it("adds a row derived from an existing item", async () => {
    await db.insert(items).values({
      id: "i1",
      roomId: "r1",
      name: "Olive oil",
      unit: "bottles",
      count: 0,
      threshold: 1,
      reorderAmount: 2,
      category: "oil",
    });
    const res = await createShopping(jsonReq("http://l/api/shopping", "POST", { itemId: "i1" }));
    expect(res.status).toBe(200);

    const all = await db.select().from(shoppingItems);
    expect(all).toHaveLength(1);
    expect(all[0].name).toBe("Olive oil");
    expect(all[0].userId).toBe("u1");
    expect(all[0].quantity).toBe(2);
    expect(all[0].source).toBe("auto");
    expect(all[0].groupName).toBe("Oils & condiments");
  });

  it("does not create a duplicate if an open row already exists for that item", async () => {
    await db.insert(items).values({ id: "i1", roomId: "r1", name: "Olive oil", unit: "bottles", count: 0, threshold: 1 });
    await createShopping(jsonReq("http://l/api/shopping", "POST", { itemId: "i1" }));
    await createShopping(jsonReq("http://l/api/shopping", "POST", { itemId: "i1" }));
    const all = await db.select().from(shoppingItems);
    expect(all).toHaveLength(1);
  });

  it("returns 403 when adding from an item in a room the user can't edit", async () => {
    await db.insert(users).values({ id: "u2", email: "b@example.com", name: "B", passwordHash: "x" });
    await db.insert(rooms).values({ id: "r2", ownerId: "u2", name: "Theirs", glyph: "🥫" });
    await db.insert(items).values({ id: "i1", roomId: "r2", name: "Salt", unit: "g", count: 0, threshold: 1 });
    const res = await createShopping(jsonReq("http://l/api/shopping", "POST", { itemId: "i1" }));
    expect(res.status).toBe(403);
  });
});

describe("PATCH /api/shopping/[id]", () => {
  it("toggles done", async () => {
    await db.insert(shoppingItems).values({ id: "s1", userId: "u1", name: "Bread", quantity: 1, unit: "loaf" });
    const res = await patchShopping(jsonReq("http://l/api/shopping/s1", "PATCH", { done: true }), idParams("s1"));
    expect(res.status).toBe(200);
    const found = await db.select().from(shoppingItems).where(eq(shoppingItems.id, "s1"));
    expect(found[0].done).toBe(true);
  });

  it("returns 404 when patching another user's item", async () => {
    await db.insert(users).values({ id: "u2", email: "b@example.com", name: "B", passwordHash: "x" });
    await db.insert(shoppingItems).values({
      id: "s1",
      userId: "u2",
      name: "Bread",
      quantity: 1,
      unit: "loaf",
    });
    const res = await patchShopping(jsonReq("http://l/api/shopping/s1", "PATCH", { done: true }), idParams("s1"));
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/shopping/[id]", () => {
  it("removes the row owned by the user", async () => {
    await db.insert(shoppingItems).values({ id: "s1", userId: "u1", name: "Bread", quantity: 1, unit: "loaf" });
    const res = await deleteShopping(new NextRequest("http://l/api/shopping/s1", { method: "DELETE" }), idParams("s1"));
    expect(res.status).toBe(200);
    expect(await db.select().from(shoppingItems)).toHaveLength(0);
  });
});

describe("POST /api/shopping/clear-done", () => {
  it("removes only done rows for the current user", async () => {
    await db.insert(users).values({ id: "u2", email: "b@example.com", name: "B", passwordHash: "x" });
    await db.insert(shoppingItems).values([
      { id: "s1", userId: "u1", name: "Bread", quantity: 1, unit: "loaf", done: true },
      { id: "s2", userId: "u1", name: "Milk", quantity: 1, unit: "L", done: false },
      { id: "s3", userId: "u2", name: "Eggs", quantity: 12, unit: "ct", done: true },
    ]);
    const res = await clearDone();
    expect(res.status).toBe(200);
    const remaining = await db.select().from(shoppingItems);
    const ids = remaining.map((r) => r.id).sort();
    expect(ids).toEqual(["s2", "s3"]);
  });
});
