import { NextRequest, NextResponse } from "next/server";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";
import { db, items, rooms } from "@/db";
import { getAccessibleRoomIds } from "@/lib/access";
import { fetchOffProduct } from "@/lib/barcode/openfoodfacts";

export const dynamic = "force-dynamic";

const CodeSchema = z.string().regex(/^\d{8,14}$/);

export async function GET(_req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const { code: rawCode } = await params;
  const parsed = CodeSchema.safeParse(rawCode);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid barcode." }, { status: 400 });
  }
  const code = parsed.data;

  const [matchRow, off] = await Promise.all([
    findMatch(session.user.id, code),
    fetchOffProduct(code),
  ]);

  const init = matchRow ? undefined : { headers: { "Cache-Control": "private, max-age=300" } };
  return NextResponse.json({ code, match: matchRow, off }, init);
}

async function findMatch(userId: string, code: string) {
  const accessibleIds = await getAccessibleRoomIds(userId);
  if (accessibleIds.length === 0) {
    return null;
  }
  const liveRooms = await db
    .select({ id: rooms.id, name: rooms.name, glyph: rooms.glyph })
    .from(rooms)
    .where(and(inArray(rooms.id, accessibleIds), isNull(rooms.archivedAt)));
  if (liveRooms.length === 0) {
    return null;
  }
  const liveIds = liveRooms.map((r) => r.id);
  const matches = await db
    .select()
    .from(items)
    .where(and(inArray(items.roomId, liveIds), eq(items.barcode, code)))
    .limit(1);
  if (matches.length === 0) {
    return null;
  }
  const item = matches[0];
  const room = liveRooms.find((r) => r.id === item.roomId);
  if (!room) {
    return null;
  }
  return {
    id: item.id,
    name: item.name,
    brand: item.brand,
    photoUrl: item.photoUrl,
    roomId: room.id,
    roomName: room.name,
    roomGlyph: room.glyph,
    count: item.count,
    unit: item.unit,
    openedAt: item.openedAt ? item.openedAt.toISOString() : null,
  };
}
