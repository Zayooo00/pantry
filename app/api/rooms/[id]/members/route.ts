import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db, roomMembers, rooms, users } from "@/db";
import { auth } from "@/auth";
import { canViewRoom, isRoomOwner } from "@/lib/access";
import { InviteMemberRequest } from "@/lib/api/schemas";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const { id } = await params;
  if (!(await canViewRoom(session.user.id, id))) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  const room = await db
    .select({ ownerId: rooms.ownerId, name: rooms.name })
    .from(rooms)
    .where(eq(rooms.id, id))
    .limit(1);
  if (room.length === 0) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  const owner = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, room[0].ownerId))
    .limit(1);
  const members = await db
    .select({
      id: roomMembers.id,
      userId: users.id,
      name: users.name,
      email: users.email,
      role: roomMembers.role,
      createdAt: roomMembers.createdAt,
    })
    .from(roomMembers)
    .innerJoin(users, eq(users.id, roomMembers.userId))
    .where(eq(roomMembers.roomId, id));

  return NextResponse.json({
    owner: owner[0] ?? null,
    members,
    isOwner: room[0].ownerId === session.user.id,
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const { id } = await params;
  if (!(await isRoomOwner(session.user.id, id))) {
    return NextResponse.json({ error: "Only the owner can invite members." }, { status: 403 });
  }
  const parsed = InviteMemberRequest.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const found = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(eq(users.email, parsed.data.email))
    .limit(1);
  if (found.length === 0) {
    return NextResponse.json(
      { error: "No account with that email. They need to sign up first." },
      { status: 404 },
    );
  }
  const target = found[0];
  if (target.id === session.user.id) {
    return NextResponse.json({ error: "You're already the owner." }, { status: 409 });
  }
  const existing = await db
    .select({ id: roomMembers.id })
    .from(roomMembers)
    .where(and(eq(roomMembers.roomId, id), eq(roomMembers.userId, target.id)))
    .limit(1);
  if (existing.length > 0) {
    return NextResponse.json({ error: "Already a member." }, { status: 409 });
  }
  await db.insert(roomMembers).values({
    id: randomUUID(),
    roomId: id,
    userId: target.id,
    role: parsed.data.role,
    invitedBy: session.user.id,
  });
  return NextResponse.json({
    member: {
      userId: target.id,
      name: target.name,
      email: target.email,
      role: parsed.data.role,
    },
  });
}
