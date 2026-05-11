import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db, rooms, items, itemEvents, users, roomMembers } from "@/db";

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => ({ user: { id: "u1", name: "Alex", email: "alex@example.com" } })),
}));

import { POST as createItem } from "@/app/api/items/route";
import { PATCH as patchItem, DELETE as deleteItem } from "@/app/api/items/[id]/route";
import { POST as openItem } from "@/app/api/items/[id]/open/route";

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
  await db.insert(rooms).values({ id: "r1", ownerId: "u1", name: "Pantry", glyph: "🥫" });
});

describe("POST /api/items", () => {
  it("creates an item and writes a 'created' event", async () => {
    const res = await createItem(
      jsonReq("http://l/api/items", "POST", {
        roomId: "r1",
        name: "Olive oil",
        unit: "bottles",
        count: 2,
      }),
    );
    expect(res.status).toBe(200);
    const { id } = await res.json();
    expect(typeof id).toBe("string");

    const stored = await db.select().from(items).where(eq(items.id, id));
    expect(stored[0].name).toBe("Olive oil");

    const events = await db.select().from(itemEvents).where(eq(itemEvents.itemId, id));
    expect(events).toHaveLength(1);
    expect(events[0].kind).toBe("created");
    expect(events[0].countAfter).toBe(2);
    expect(events[0].userId).toBe("u1");
  });

  it("coerces numeric strings (form input)", async () => {
    const res = await createItem(
      jsonReq("http://l/api/items", "POST", {
        roomId: "r1",
        name: "Salt",
        unit: "g",
        count: "500",
        threshold: "100",
      }),
    );
    expect(res.status).toBe(200);
    const all = await db.select().from(items);
    expect(all[0].count).toBe(500);
    expect(all[0].threshold).toBe(100);
  });

  it("rejects when roomId is missing", async () => {
    const res = await createItem(
      jsonReq("http://l/api/items", "POST", { name: "x", unit: "g", count: 1 }),
    );
    expect(res.status).toBe(400);
  });

  it("rejects creating an item in a room the user can't edit", async () => {
    await db
      .insert(users)
      .values({ id: "u2", email: "b@example.com", name: "B", passwordHash: "x" });
    await db.insert(rooms).values({ id: "r2", ownerId: "u2", name: "Theirs", glyph: "🥫" });
    const res = await createItem(
      jsonReq("http://l/api/items", "POST", {
        roomId: "r2",
        name: "Olive oil",
        unit: "bottles",
        count: 1,
      }),
    );
    expect(res.status).toBe(403);
  });

  it("allows editor members to create items", async () => {
    await db
      .insert(users)
      .values({ id: "u2", email: "b@example.com", name: "B", passwordHash: "x" });
    await db.insert(rooms).values({ id: "r2", ownerId: "u2", name: "Shared", glyph: "🥫" });
    await db.insert(roomMembers).values({
      id: "m1",
      roomId: "r2",
      userId: "u1",
      role: "editor",
      invitedBy: "u2",
    });
    const res = await createItem(
      jsonReq("http://l/api/items", "POST", {
        roomId: "r2",
        name: "Salt",
        unit: "g",
        count: 1,
      }),
    );
    expect(res.status).toBe(200);
  });
});

describe("PATCH /api/items/[id]", () => {
  it("renames an item without writing a count event", async () => {
    await db.insert(items).values({ id: "i1", roomId: "r1", name: "Salt", unit: "g", count: 100 });
    const res = await patchItem(
      jsonReq("http://l/api/items/i1", "PATCH", { name: "Sea salt" }),
      idParams("i1"),
    );
    expect(res.status).toBe(200);

    const updated = await db.select().from(items).where(eq(items.id, "i1"));
    expect(updated[0].name).toBe("Sea salt");
    const events = await db.select().from(itemEvents);
    expect(events).toHaveLength(0);
  });

  it("count-only patch writes a restock event with positive delta", async () => {
    await db.insert(items).values({ id: "i1", roomId: "r1", name: "Salt", unit: "g", count: 100 });
    const res = await patchItem(
      jsonReq("http://l/api/items/i1", "PATCH", { count: 250 }),
      idParams("i1"),
    );
    expect(res.status).toBe(200);

    const updated = await db.select().from(items).where(eq(items.id, "i1"));
    expect(updated[0].count).toBe(250);

    const events = await db.select().from(itemEvents);
    expect(events).toHaveLength(1);
    expect(events[0].kind).toBe("restock");
    expect(events[0].delta).toBe(150);
    expect(events[0].countAfter).toBe(250);
    expect(events[0].userId).toBe("u1");
  });

  it("count-only patch with negative delta writes a consume event", async () => {
    await db.insert(items).values({ id: "i1", roomId: "r1", name: "Salt", unit: "g", count: 100 });
    await patchItem(jsonReq("http://l/api/items/i1", "PATCH", { count: 40 }), idParams("i1"));
    const events = await db.select().from(itemEvents);
    expect(events[0].kind).toBe("consume");
    expect(events[0].delta).toBe(-60);
  });

  it("returns 403 when the user can't edit the source room", async () => {
    await db
      .insert(users)
      .values({ id: "u2", email: "b@example.com", name: "B", passwordHash: "x" });
    await db.insert(rooms).values({ id: "r2", ownerId: "u2", name: "Theirs", glyph: "🥫" });
    await db.insert(items).values({ id: "i1", roomId: "r2", name: "Salt", unit: "g", count: 100 });
    const res = await patchItem(
      jsonReq("http://l/api/items/i1", "PATCH", { name: "X" }),
      idParams("i1"),
    );
    expect(res.status).toBe(403);
  });
});

describe("DELETE /api/items/[id]", () => {
  it("removes the item and cascades item_events", async () => {
    await db.insert(items).values({ id: "i1", roomId: "r1", name: "Salt", unit: "g", count: 1 });
    await db.insert(itemEvents).values({ id: "e1", itemId: "i1", kind: "created" });

    const res = await deleteItem(
      new NextRequest("http://l/api/items/i1", { method: "DELETE" }),
      idParams("i1"),
    );
    expect(res.status).toBe(200);
    expect(await db.select().from(items)).toHaveLength(0);
    expect(await db.select().from(itemEvents)).toHaveLength(0);
  });
});

describe("POST /api/items/[id]/open", () => {
  it("sets openedAt and logs an 'opened' event with session user as actor", async () => {
    await db.insert(items).values({ id: "i1", roomId: "r1", name: "Milk", unit: "L", count: 1 });
    const res = await openItem(
      new Request("http://l/api/items/i1/open", { method: "POST" }),
      idParams("i1"),
    );
    expect(res.status).toBe(200);

    const updated = await db.select().from(items).where(eq(items.id, "i1"));
    expect(updated[0].openedAt).toBeInstanceOf(Date);

    const events = await db.select().from(itemEvents);
    expect(events).toHaveLength(1);
    expect(events[0].kind).toBe("opened");
    expect(events[0].actor).toBe("Alex");
    expect(events[0].userId).toBe("u1");
  });
});

describe("photoUrl ownership on items", () => {
  it("POST accepts a photoUrl whose path segment matches the requester", async () => {
    const res = await createItem(
      jsonReq("http://l/api/items", "POST", {
        roomId: "r1",
        name: "Olive oil",
        unit: "bottles",
        count: 1,
        photoUrl: "/api/photos/items/u1/abc-olive.png",
      }),
    );
    expect(res.status).toBe(200);
  });

  it("POST accepts external https photoUrls", async () => {
    const res = await createItem(
      jsonReq("http://l/api/items", "POST", {
        roomId: "r1",
        name: "Olive oil",
        unit: "bottles",
        count: 1,
        photoUrl: "https://world.openfoodfacts.org/images/products/123.jpg",
      }),
    );
    expect(res.status).toBe(200);
  });

  it("POST rejects a /api/photos URL belonging to another user", async () => {
    const res = await createItem(
      jsonReq("http://l/api/items", "POST", {
        roomId: "r1",
        name: "Olive oil",
        unit: "bottles",
        count: 1,
        photoUrl: "/api/photos/items/someone-else/abc-olive.png",
      }),
    );
    expect(res.status).toBe(403);
  });

  it("PATCH allows keeping an existing photoUrl that was uploaded by someone else", async () => {
    await db
      .insert(users)
      .values({ id: "u2", email: "b@example.com", name: "B", passwordHash: "x" });
    await db.insert(rooms).values({ id: "r2", ownerId: "u2", name: "Shared", glyph: "🥫" });
    await db.insert(roomMembers).values({
      id: "m1",
      roomId: "r2",
      userId: "u1",
      role: "editor",
      invitedBy: "u2",
    });
    await db.insert(items).values({
      id: "i1",
      roomId: "r2",
      name: "Salt",
      unit: "g",
      count: 100,
      photoUrl: "/api/photos/items/u2/abc-salt.png",
    });
    const res = await patchItem(
      jsonReq("http://l/api/items/i1", "PATCH", {
        count: 50,
        photoUrl: "/api/photos/items/u2/abc-salt.png",
      }),
      idParams("i1"),
    );
    expect(res.status).toBe(200);
  });

  it("PATCH rejects a swap to a photoUrl the requester didn't upload", async () => {
    await db.insert(items).values({
      id: "i1",
      roomId: "r1",
      name: "Salt",
      unit: "g",
      count: 100,
      photoUrl: "/api/photos/items/u1/old.png",
    });
    const res = await patchItem(
      jsonReq("http://l/api/items/i1", "PATCH", {
        photoUrl: "/api/photos/items/someone-else/abc-salt.png",
      }),
      idParams("i1"),
    );
    expect(res.status).toBe(403);
  });
});
