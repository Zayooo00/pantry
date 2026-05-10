import { NextResponse } from "next/server";
import { db, items, roomMembers, roomPositions, rooms, shoppingItems } from "@/db";
import { and, asc, eq, inArray, isNull, or, sql } from "drizzle-orm";
import { itemStatus } from "@/lib/format";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const userId = session.user.id;

  const [sidebarRows, shopping] = await Promise.all([
    db
      .select({ room: rooms, memberRole: roomMembers.role })
      .from(rooms)
      .leftJoin(roomMembers, and(eq(roomMembers.roomId, rooms.id), eq(roomMembers.userId, userId)))
      .leftJoin(
        roomPositions,
        and(eq(roomPositions.roomId, rooms.id), eq(roomPositions.userId, userId)),
      )
      .where(
        and(
          isNull(rooms.archivedAt),
          or(eq(rooms.ownerId, userId), eq(roomMembers.userId, userId)),
        ),
      )
      .orderBy(asc(sql`coalesce(${roomPositions.position}, ${rooms.position})`)),
    db
      .select({ id: shoppingItems.id })
      .from(shoppingItems)
      .where(and(eq(shoppingItems.userId, userId), eq(shoppingItems.done, false))),
  ]);

  const liveIds = sidebarRows.map((r) => r.room.id);
  const allItems =
    liveIds.length === 0 ? [] : await db.select().from(items).where(inArray(items.roomId, liveIds));

  const enriched = sidebarRows.map(({ room, memberRole }) => {
    const roomItems = allItems.filter((i) => i.roomId === room.id);
    const low = roomItems.filter(
      (i) =>
        itemStatus({ count: i.count, threshold: i.threshold, expiresAt: i.expiresAt }) === "low",
    ).length;
    return {
      id: room.id,
      name: room.name,
      glyph: room.glyph,
      count: roomItems.length,
      low,
      role: room.ownerId === userId ? "owner" : (memberRole ?? "viewer"),
    };
  });

  return NextResponse.json({ rooms: enriched, shoppingCount: shopping.length });
}
