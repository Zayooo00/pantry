import { NextRequest, NextResponse } from "next/server";
import { db, rooms, items } from "@/db";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { canEditRoom, isRoomOwner } from "@/lib/access";
import { PatchRoomRequest } from "@/lib/api/schemas";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const { id } = await params;
  const parsed = PatchRoomRequest.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { archived, ...rest } = parsed.data;
  if (archived !== undefined && !(await isRoomOwner(session.user.id, id))) {
    return NextResponse.json({ error: "Only the owner can archive this room." }, { status: 403 });
  }
  if (Object.keys(rest).length > 0 && !(await canEditRoom(session.user.id, id))) {
    return NextResponse.json({ error: "You can't edit this room." }, { status: 403 });
  }
  const update: Partial<typeof rooms.$inferInsert> = { ...rest };
  if (archived !== undefined) {
    update.archivedAt = archived ? new Date() : null;
  }
  await db.update(rooms).set(update).where(eq(rooms.id, id));
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const { id } = await params;
  if (!(await isRoomOwner(session.user.id, id))) {
    return NextResponse.json({ error: "Only the owner can delete this room." }, { status: 403 });
  }
  const remaining = await db.select({ id: items.id }).from(items).where(eq(items.roomId, id)).limit(1);
  if (remaining.length > 0) {
    return NextResponse.json(
      { error: "Move or remove items first — this room still holds inventory." },
      { status: 409 },
    );
  }
  await db.delete(rooms).where(eq(rooms.id, id));
  return NextResponse.json({ ok: true });
}
