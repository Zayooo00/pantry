import { NextResponse } from "next/server";
import { db, items, itemEvents } from "@/db";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { auth } from "@/auth";
import { canEditRoom, getItemRoomId } from "@/lib/access";

export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
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
    return NextResponse.json({ error: "You can't edit this item." }, { status: 403 });
  }
  const now = new Date();
  await db.update(items).set({ openedAt: now, updatedAt: now }).where(eq(items.id, id));
  await db.insert(itemEvents).values({
    id: randomUUID(),
    itemId: id,
    userId: session.user.id,
    kind: "opened",
    note: "Marked open",
    actor: session.user.name ?? "Someone",
  });
  return NextResponse.json({ ok: true });
}
