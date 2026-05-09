import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db, pendingInvites, roomMembers, rooms, users } from "@/db";
import { auth } from "@/auth";
import { canViewRoom, isRoomOwner } from "@/lib/access";
import { InviteMemberRequest } from "@/lib/api/schemas";
import { appUrl, emailLayout, escapeHtml, isEmailConfigured, sendEmail } from "@/lib/email";
import { generateToken, hashToken } from "@/lib/tokens";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { readJsonOr400 } from "@/lib/json";

const INVITE_TTL_MS = 14 * 24 * 60 * 60 * 1000;

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
  const body = await readJsonOr400(req);
  if (body instanceof NextResponse) {
    return body;
  }
  const parsed = InviteMemberRequest.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const limited = rateLimit({
    bucket: "invite",
    key: `${session.user.id}|${clientKey(req)}`,
    max: 30,
    windowMs: 60 * 60 * 1000,
  });
  if (!limited.allowed) {
    return NextResponse.json(
      { error: "Too many invites. Try again later." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } },
    );
  }
  const found = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(eq(users.email, parsed.data.email))
    .limit(1);
  const room = await db.select({ name: rooms.name }).from(rooms).where(eq(rooms.id, id)).limit(1);
  const inviter = await db
    .select({ name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);
  const roomName = room[0]?.name ?? "a room";
  const inviterName = inviter[0]?.name ?? "Someone";

  if (found.length === 0) {
    if (!isEmailConfigured()) {
      return NextResponse.json(
        {
          error:
            "Email isn't configured on this server, so we can't invite people who don't have an account yet.",
        },
        { status: 503 },
      );
    }
    const token = generateToken();
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + INVITE_TTL_MS);
    await db
      .insert(pendingInvites)
      .values({
        id: randomUUID(),
        roomId: id,
        email: parsed.data.email,
        role: parsed.data.role,
        tokenHash,
        invitedBy: session.user.id,
        expiresAt,
      })
      .onConflictDoUpdate({
        target: [pendingInvites.roomId, pendingInvites.email],
        set: {
          tokenHash,
          role: parsed.data.role,
          invitedBy: session.user.id,
          expiresAt,
          acceptedAt: null,
        },
      });
    const url = `${appUrl()}/invite/${encodeURIComponent(token)}`;
    const send = await sendEmail({
      to: parsed.data.email,
      subject: `${inviterName} invited you to ${roomName} on Pantry`,
      html: emailLayout({
        preheader: `${inviterName} shared ${roomName} with you on Pantry.`,
        body: `
          <p style="margin:0 0 16px"><strong>${escapeHtml(inviterName)}</strong> invited you to share <em>${escapeHtml(roomName)}</em> on Pantry — a quiet inventory for the household.</p>
          <p style="margin:0 0 16px">Role: <strong>${parsed.data.role}</strong></p>
          <p style="margin:0 0 24px">
            <a href="${url}" style="display:inline-block;background:#1a1814;color:#fbfaf6;padding:12px 20px;border-radius:6px;font-family:Georgia,serif;font-size:16px;text-decoration:none;">Accept invite</a>
          </p>
          <p style="margin:0 0 16px;color:#7c7669;font-size:13px;">
            You'll need to create a Pantry account first (or sign in if you already have one). The link expires in 14 days.
          </p>
          <p style="margin:0;color:#7c7669;font-size:11px;font-family:monospace;word-break:break-all;">${escapeHtml(url)}</p>
        `,
      }),
      text: `${inviterName} invited you to ${roomName} on Pantry. Accept: ${url}\n\nYou'll need to sign up or sign in. The link expires in 14 days.`,
    });
    if (!send.ok) {
      return NextResponse.json({ error: send.message }, { status: 500 });
    }
    return NextResponse.json({
      pending: { email: parsed.data.email, role: parsed.data.role },
    });
  }

  const target = found[0];
  if (target.id === session.user.id) {
    return NextResponse.json({ error: "You're already the owner." }, { status: 409 });
  }
  const inserted = await db
    .insert(roomMembers)
    .values({
      id: randomUUID(),
      roomId: id,
      userId: target.id,
      role: parsed.data.role,
      invitedBy: session.user.id,
    })
    .onConflictDoNothing({ target: [roomMembers.roomId, roomMembers.userId] })
    .returning({ id: roomMembers.id });
  if (inserted.length === 0) {
    return NextResponse.json({ error: "Already a member." }, { status: 409 });
  }
  return NextResponse.json({
    member: {
      userId: target.id,
      name: target.name,
      email: target.email,
      role: parsed.data.role,
    },
  });
}
