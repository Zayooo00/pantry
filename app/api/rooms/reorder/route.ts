import { NextRequest, NextResponse } from "next/server";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db, roomMembers, roomPositions, rooms } from "@/db";
import { auth } from "@/auth";
import { ReorderRoomsRequest } from "@/lib/api/schemas";
import { readJsonOr400 } from "@/lib/json";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const userId = session.user.id;
  const body = await readJsonOr400(req);
  if (body instanceof NextResponse) {
    return body;
  }
  const parsed = ReorderRoomsRequest.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [owned, shared] = await Promise.all([
    db
      .select({ id: rooms.id })
      .from(rooms)
      .where(and(eq(rooms.ownerId, userId), inArray(rooms.id, parsed.data.order))),
    db
      .select({ id: roomMembers.roomId })
      .from(roomMembers)
      .where(and(eq(roomMembers.userId, userId), inArray(roomMembers.roomId, parsed.data.order))),
  ]);
  const accessible = new Set([...owned.map((r) => r.id), ...shared.map((r) => r.id)]);
  const ordered = parsed.data.order.filter((id) => accessible.has(id));
  if (ordered.length === 0) {
    return NextResponse.json({ ok: true });
  }

  const rows = ordered.map((roomId, position) => ({ userId, roomId, position }));
  await db
    .insert(roomPositions)
    .values(rows)
    .onConflictDoUpdate({
      target: [roomPositions.userId, roomPositions.roomId],
      set: { position: sql`excluded.position` },
    });
  return NextResponse.json({ ok: true });
}
