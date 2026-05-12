import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { db, rooms, items, users, roomMembers } from "@/db";

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => ({ user: { id: "u1", name: "Alex", email: "alex@example.com" } })),
}));

vi.mock("@/lib/barcode/openfoodfacts", () => ({
  fetchOffProduct: vi.fn(),
}));

import { GET } from "@/app/api/barcode/[code]/route";
import { fetchOffProduct } from "@/lib/barcode/openfoodfacts";

const mockedFetchOff = vi.mocked(fetchOffProduct);

function codeParams(code: string) {
  return { params: Promise.resolve({ code }) };
}

beforeEach(async () => {
  mockedFetchOff.mockReset();
  mockedFetchOff.mockResolvedValue(null);
  await db.insert(users).values([
    { id: "u1", email: "alex@example.com", name: "Alex", passwordHash: "x" },
    { id: "u2", email: "b@example.com", name: "B", passwordHash: "x" },
  ]);
  await db.insert(rooms).values([
    { id: "r1", ownerId: "u1", name: "Pantry", glyph: "🥫" },
    { id: "rArch", ownerId: "u1", name: "Archived", glyph: "📦", archivedAt: new Date() },
    { id: "rOther", ownerId: "u2", name: "Theirs", glyph: "❄️" },
  ]);
});

describe("GET /api/barcode/[code]", () => {
  it("returns 400 when the code is malformed", async () => {
    const res = await GET(new NextRequest("http://l/api/barcode/abc"), codeParams("abc"));
    expect(res.status).toBe(400);
  });

  it("returns 400 when the code is too short", async () => {
    const res = await GET(new NextRequest("http://l/api/barcode/1234567"), codeParams("1234567"));
    expect(res.status).toBe(400);
  });

  it("returns match=null, off=null when nothing is found", async () => {
    const res = await GET(new NextRequest("http://l/api/barcode/00000000"), codeParams("00000000"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ code: "00000000", match: null, off: null });
  });

  it("finds an item in the user's own room", async () => {
    await db.insert(items).values({
      id: "i1",
      roomId: "r1",
      name: "Olive oil",
      unit: "bottles",
      count: 2,
      barcode: "8014203778124",
      brand: "Tuscan",
    });
    const res = await GET(
      new NextRequest("http://l/api/barcode/8014203778124"),
      codeParams("8014203778124"),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.match).toMatchObject({
      id: "i1",
      name: "Olive oil",
      roomId: "r1",
      roomName: "Pantry",
      count: 2,
      unit: "bottles",
      brand: "Tuscan",
    });
  });

  it("excludes matches from archived rooms", async () => {
    await db.insert(items).values({
      id: "iA",
      roomId: "rArch",
      name: "Old salt",
      unit: "g",
      count: 10,
      barcode: "1111111111111",
    });
    const res = await GET(
      new NextRequest("http://l/api/barcode/1111111111111"),
      codeParams("1111111111111"),
    );
    const json = await res.json();
    expect(json.match).toBeNull();
  });

  it("excludes matches from rooms the user can't access", async () => {
    await db.insert(items).values({
      id: "iO",
      roomId: "rOther",
      name: "Their oil",
      unit: "bottles",
      count: 1,
      barcode: "2222222222222",
    });
    const res = await GET(
      new NextRequest("http://l/api/barcode/2222222222222"),
      codeParams("2222222222222"),
    );
    const json = await res.json();
    expect(json.match).toBeNull();
  });

  it("includes matches from rooms shared as editor", async () => {
    await db.insert(roomMembers).values({
      id: "m1",
      roomId: "rOther",
      userId: "u1",
      role: "editor",
      invitedBy: "u2",
    });
    await db.insert(items).values({
      id: "iS",
      roomId: "rOther",
      name: "Shared sugar",
      unit: "g",
      count: 500,
      barcode: "3333333333333",
    });
    const res = await GET(
      new NextRequest("http://l/api/barcode/3333333333333"),
      codeParams("3333333333333"),
    );
    const json = await res.json();
    expect(json.match).toMatchObject({ id: "iS", roomId: "rOther", roomName: "Theirs" });
  });

  it("returns the off product when Open Food Facts has data", async () => {
    mockedFetchOff.mockResolvedValueOnce({
      name: "Filippo Berio EVOO",
      brand: "Filippo Berio",
      imageUrl: "https://images.openfoodfacts.org/abc.jpg",
      quantity: "500 ml",
    });
    const res = await GET(
      new NextRequest("http://l/api/barcode/9999999999993"),
      codeParams("9999999999993"),
    );
    const json = await res.json();
    expect(json.off).toMatchObject({ name: "Filippo Berio EVOO", brand: "Filippo Berio" });
    expect(json.match).toBeNull();
  });

  it("can return both a match and an off product", async () => {
    await db.insert(items).values({
      id: "iBoth",
      roomId: "r1",
      name: "Generic salt",
      unit: "g",
      count: 1,
      barcode: "4444444444444",
    });
    mockedFetchOff.mockResolvedValueOnce({
      name: "Maldon Sea Salt",
      brand: "Maldon",
      imageUrl: null,
      quantity: "240 g",
    });
    const res = await GET(
      new NextRequest("http://l/api/barcode/4444444444444"),
      codeParams("4444444444444"),
    );
    const json = await res.json();
    expect(json.match?.id).toBe("iBoth");
    expect(json.off?.brand).toBe("Maldon");
  });
});

describe("GET /api/barcode/[code] · auth", () => {
  it("returns 401 when not signed in", async () => {
    const { auth } = await import("@/auth");
    vi.mocked(auth).mockResolvedValueOnce(null as never);
    const res = await GET(new NextRequest("http://l/api/barcode/00000000"), codeParams("00000000"));
    expect(res.status).toBe(401);
  });
});
