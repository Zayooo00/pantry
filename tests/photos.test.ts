import { describe, it, expect, vi, beforeEach } from "vitest";
import { db, users, rooms, roomMembers, items } from "@/db";

const sessionMock = vi.hoisted(() => ({
  value: { user: { id: "u1", name: "Alex", email: "alex@example.com" } } as {
    user: { id: string; name: string; email: string };
  } | null,
}));

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => sessionMock.value),
}));

import { GET } from "@/app/api/photos/[...path]/route";

function pathParams(path: string[]) {
  return { params: Promise.resolve({ path }) };
}

beforeEach(async () => {
  sessionMock.value = { user: { id: "u1", name: "Alex", email: "alex@example.com" } };
  vi.stubEnv("E2E_BLOB_LOCAL", "1");
  await db.insert(users).values([
    { id: "u1", email: "alex@example.com", name: "Alex", passwordHash: "x" },
    { id: "u2", email: "bob@example.com", name: "Bob", passwordHash: "x" },
    { id: "u3", email: "carol@example.com", name: "Carol", passwordHash: "x" },
  ]);
  await db.insert(rooms).values([
    { id: "r-alex", ownerId: "u1", name: "Alex's", glyph: "🥫" },
    { id: "r-bob", ownerId: "u2", name: "Bob's", glyph: "🥫" },
  ]);
});

describe("GET /api/photos/[...path]", () => {
  it("401s when not signed in", async () => {
    sessionMock.value = null;
    const res = await GET(
      new Request("http://l/api/photos/items/u1/abc.png"),
      pathParams(["items", "u1", "abc.png"]),
    );
    expect(res.status).toBe(401);
  });

  it("serves blobs whose path's user-id segment matches the requester (uploader shortcut)", async () => {
    const res = await GET(
      new Request("http://l/api/photos/items/u1/abc.png"),
      pathParams(["items", "u1", "abc.png"]),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
  });

  it("serves blobs referenced by an item in a room the requester can view", async () => {
    await db.insert(items).values({
      id: "i1",
      roomId: "r-bob",
      name: "Salt",
      unit: "g",
      count: 100,
      photoUrl: "/api/photos/items/u2/abc.png",
    });
    await db.insert(roomMembers).values({
      id: "m1",
      roomId: "r-bob",
      userId: "u1",
      role: "viewer",
      invitedBy: "u2",
    });
    const res = await GET(
      new Request("http://l/api/photos/items/u2/abc.png"),
      pathParams(["items", "u2", "abc.png"]),
    );
    expect(res.status).toBe(200);
  });

  it("404s on a path the user did not upload and no accessible item references", async () => {
    await db.insert(items).values({
      id: "i1",
      roomId: "r-bob",
      name: "Salt",
      unit: "g",
      count: 100,
      photoUrl: "/api/photos/items/u2/abc.png",
    });
    // u1 has no membership in r-bob
    const res = await GET(
      new Request("http://l/api/photos/items/u2/abc.png"),
      pathParams(["items", "u2", "abc.png"]),
    );
    expect(res.status).toBe(404);
  });

  it("404s on a path with no matching item and no uploader match", async () => {
    const res = await GET(
      new Request("http://l/api/photos/items/u2/ghost.png"),
      pathParams(["items", "u2", "ghost.png"]),
    );
    expect(res.status).toBe(404);
  });

  it("denies a confused-deputy attempt: u3 attaches u2's URL via their own room, u1 still can't view it", async () => {
    await db.insert(rooms).values({ id: "r-carol", ownerId: "u3", name: "Carol's", glyph: "🥫" });
    await db.insert(items).values({
      id: "i-stolen",
      roomId: "r-carol",
      name: "Borrowed",
      unit: "g",
      count: 1,
      photoUrl: "/api/photos/items/u2/abc.png",
    });
    // u1 is not in r-carol or r-bob
    const res = await GET(
      new Request("http://l/api/photos/items/u2/abc.png"),
      pathParams(["items", "u2", "abc.png"]),
    );
    expect(res.status).toBe(404);
  });
});
