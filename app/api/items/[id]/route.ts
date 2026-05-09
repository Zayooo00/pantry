import { NextRequest, NextResponse } from "next/server";
import { db, items } from "@/db";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { canEditRoom, getItemRoomId } from "@/lib/access";
import { getItem, maybeNotifyThresholdCross, updateItemCount } from "@/lib/queries";
import { PatchItemRequest } from "@/lib/api/schemas";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const { id } = await params;
  const currentRoomId = await getItemRoomId(id);
  if (!currentRoomId) {
    return NextResponse.json({ error: "Item not found." }, { status: 404 });
  }
  if (!(await canEditRoom(session.user.id, currentRoomId))) {
    return NextResponse.json({ error: "You can't edit this item." }, { status: 403 });
  }
  const parsed = PatchItemRequest.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;
  if (data.roomId && data.roomId !== currentRoomId) {
    if (!(await canEditRoom(session.user.id, data.roomId))) {
      return NextResponse.json({ error: "You can't move items to that room." }, { status: 403 });
    }
  }
  if (typeof data.count === "number" && Object.keys(data).length === 1) {
    await updateItemCount(id, data.count, {
      id: session.user.id,
      name: session.user.name ?? "Someone",
    });
    return NextResponse.json({ ok: true });
  }
  const before = await getItem(id);
  await db
    .update(items)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(items.id, id));
  if (before && (typeof data.count === "number" || data.threshold !== undefined)) {
    const newCount = typeof data.count === "number" ? data.count : before.count;
    const newThreshold =
      data.threshold === undefined ? before.threshold : data.threshold;
    await maybeNotifyThresholdCross({
      itemId: id,
      itemName: data.name ?? before.name,
      roomId: before.roomId,
      threshold: newThreshold,
      oldCount: before.count,
      newCount,
      actorId: session.user.id,
      actorName: session.user.name ?? null,
    });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const { id } = await params;
  const roomId = await getItemRoomId(id);
  if (!roomId) {
    return NextResponse.json({ error: "Item not found." }, { status: 404 });
  }
  if (!(await canEditRoom(session.user.id, roomId))) {
    return NextResponse.json({ error: "You can't delete this item." }, { status: 403 });
  }
  await db.delete(items).where(eq(items.id, id));
  return NextResponse.json({ ok: true });
}
