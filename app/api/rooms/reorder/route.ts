import { NextRequest, NextResponse } from "next/server";
import { db, rooms } from "@/db";
import { and, eq, inArray } from "drizzle-orm";
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
  const owned = await db
    .select({ id: rooms.id })
    .from(rooms)
    .where(and(eq(rooms.ownerId, userId), inArray(rooms.id, parsed.data.order)));
  const ownedIds = new Set(owned.map((r) => r.id));
  const updates = parsed.data.order
    .filter((id) => ownedIds.has(id))
    .map((id, pos) => db.update(rooms).set({ position: pos }).where(eq(rooms.id, id)));
  if (updates.length > 0) {
    await db.batch(updates as [(typeof updates)[number], ...(typeof updates)[number][]]);
  }
  return NextResponse.json({ ok: true });
}
