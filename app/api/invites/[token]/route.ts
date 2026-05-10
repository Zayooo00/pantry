import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db, pendingInvites, roomMembers, rooms, users } from "@/db";
import { auth } from "@/auth";
import { appendRoomPosition } from "@/lib/access";
import { hashToken } from "@/lib/tokens";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const tokenHash = hashToken(decodeURIComponent(token));
  const found = await db
    .select({
      invite: pendingInvites,
      room: { id: rooms.id, name: rooms.name, glyph: rooms.glyph },
      inviter: { name: users.name, email: users.email },
    })
    .from(pendingInvites)
    .leftJoin(rooms, eq(rooms.id, pendingInvites.roomId))
    .leftJoin(users, eq(users.id, pendingInvites.invitedBy))
    .where(eq(pendingInvites.tokenHash, tokenHash))
    .limit(1);
  if (found.length === 0 || !found[0].room) {
    return NextResponse.json({ error: "Invite not found." }, { status: 404 });
  }
  const row = found[0];
  return NextResponse.json({
    invite: {
      email: row.invite.email,
      role: row.invite.role,
      expiresAt: row.invite.expiresAt.toISOString(),
      acceptedAt: row.invite.acceptedAt?.toISOString() ?? null,
    },
    room: row.room,
    inviter: row.inviter,
  });
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Sign in or create an account first." }, { status: 401 });
  }
  const tokenHash = hashToken(decodeURIComponent(token));
  const found = await db
    .select()
    .from(pendingInvites)
    .where(eq(pendingInvites.tokenHash, tokenHash))
    .limit(1);
  if (found.length === 0) {
    return NextResponse.json({ error: "Invite not found." }, { status: 404 });
  }
  const invite = found[0];
  if (invite.acceptedAt) {
    return NextResponse.json({ error: "This invite was already accepted." }, { status: 409 });
  }
  if (invite.expiresAt.getTime() < Date.now()) {
    return NextResponse.json({ error: "This invite has expired." }, { status: 410 });
  }
  if (invite.email.toLowerCase() !== session.user.email.toLowerCase()) {
    return NextResponse.json(
      { error: `This invite is for ${invite.email}. Sign in with that account.` },
      { status: 403 },
    );
  }
  await db
    .insert(roomMembers)
    .values({
      id: randomUUID(),
      roomId: invite.roomId,
      userId: session.user.id,
      role: invite.role,
      invitedBy: invite.invitedBy,
    })
    .onConflictDoUpdate({
      target: [roomMembers.roomId, roomMembers.userId],
      set: { role: invite.role, invitedBy: invite.invitedBy },
    });
  await appendRoomPosition(session.user.id, invite.roomId);
  await db
    .update(pendingInvites)
    .set({ acceptedAt: new Date() })
    .where(eq(pendingInvites.id, invite.id));
  return NextResponse.json({ ok: true, roomId: invite.roomId });
}
