import { NextResponse } from "next/server";
import { db, items, rooms, shoppingItems } from "@/db";
import { and, asc, eq, inArray, isNull } from "drizzle-orm";
import { itemStatus } from "@/lib/format";
import { auth } from "@/auth";
import { getRoomRolesForUser } from "@/lib/access";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const userId = session.user.id;

  const roleByRoom = await getRoomRolesForUser(userId);
  const accessibleIds = Array.from(roleByRoom.keys());
  if (accessibleIds.length === 0) {
    const shopping = await db
      .select()
      .from(shoppingItems)
      .where(and(eq(shoppingItems.userId, userId), eq(shoppingItems.done, false)));
    return NextResponse.json({ rooms: [], shoppingCount: shopping.length });
  }

  const allRooms = await db
    .select()
    .from(rooms)
    .where(and(inArray(rooms.id, accessibleIds), isNull(rooms.archivedAt)))
    .orderBy(asc(rooms.position));
  const liveIds = allRooms.map((r) => r.id);
  const allItems =
    liveIds.length === 0 ? [] : await db.select().from(items).where(inArray(items.roomId, liveIds));
  const shopping = await db
    .select()
    .from(shoppingItems)
    .where(and(eq(shoppingItems.userId, userId), eq(shoppingItems.done, false)));

  const enriched = allRooms.map((r) => {
    const roomItems = allItems.filter((i) => i.roomId === r.id);
    const low = roomItems.filter(
      (i) =>
        itemStatus({ count: i.count, threshold: i.threshold, expiresAt: i.expiresAt }) === "low",
    ).length;
    return {
      id: r.id,
      name: r.name,
      glyph: r.glyph,
      count: roomItems.length,
      low,
      role: roleByRoom.get(r.id) ?? "viewer",
    };
  });

  return NextResponse.json({ rooms: enriched, shoppingCount: shopping.length });
}
