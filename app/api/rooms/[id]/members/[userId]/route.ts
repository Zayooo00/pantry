import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db, roomMembers } from "@/db";
import { auth } from "@/auth";
import { isRoomOwner } from "@/lib/access";
import { PatchMemberRequest } from "@/lib/api/schemas";
import { readJsonOr400 } from "@/lib/json";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const { id, userId } = await params;
  if (!(await isRoomOwner(session.user.id, id))) {
    return NextResponse.json({ error: "Only the owner can change roles." }, { status: 403 });
  }
  const body = await readJsonOr400(req);
  if (body instanceof NextResponse) {
    return body;
  }
  const parsed = PatchMemberRequest.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const result = await db
    .update(roomMembers)
    .set({ role: parsed.data.role })
    .where(and(eq(roomMembers.roomId, id), eq(roomMembers.userId, userId)))
    .returning({ id: roomMembers.id });
  if (result.length === 0) {
    return NextResponse.json({ error: "Member not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const { id, userId } = await params;
  const isOwner = await isRoomOwner(session.user.id, id);
  if (!isOwner && session.user.id !== userId) {
    return NextResponse.json(
      { error: "Only the owner can remove other members." },
      { status: 403 },
    );
  }
  const result = await db
    .delete(roomMembers)
    .where(and(eq(roomMembers.roomId, id), eq(roomMembers.userId, userId)))
    .returning({ id: roomMembers.id });
  if (result.length === 0) {
    return NextResponse.json({ error: "Member not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
