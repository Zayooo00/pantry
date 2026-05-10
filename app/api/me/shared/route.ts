import { NextResponse } from "next/server";
import { eq, inArray } from "drizzle-orm";
import { db, roomMembers, rooms, users } from "@/db";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const userId = session.user.id;

  const [memberships, ownedRooms] = await Promise.all([
    db
      .select({
        roomId: roomMembers.roomId,
        role: roomMembers.role,
        createdAt: roomMembers.createdAt,
      })
      .from(roomMembers)
      .where(eq(roomMembers.userId, userId)),
    db
      .select({ id: rooms.id, name: rooms.name, glyph: rooms.glyph })
      .from(rooms)
      .where(eq(rooms.ownerId, userId)),
  ]);

  const sharedRoomIds = memberships.map((m) => m.roomId);
  const ownedIds = ownedRooms.map((r) => r.id);
  const [roomRows, memberRows] = await Promise.all([
    sharedRoomIds.length === 0
      ? Promise.resolve(
          [] as {
            id: string;
            name: string;
            glyph: string;
            ownerName: string;
            ownerEmail: string;
          }[],
        )
      : db
          .select({
            id: rooms.id,
            name: rooms.name,
            glyph: rooms.glyph,
            ownerName: users.name,
            ownerEmail: users.email,
          })
          .from(rooms)
          .innerJoin(users, eq(users.id, rooms.ownerId))
          .where(inArray(rooms.id, sharedRoomIds)),
    ownedIds.length === 0
      ? Promise.resolve(
          [] as { roomId: string; userId: string; name: string; email: string; role: string }[],
        )
      : db
          .select({
            roomId: roomMembers.roomId,
            userId: users.id,
            name: users.name,
            email: users.email,
            role: roomMembers.role,
          })
          .from(roomMembers)
          .innerJoin(users, eq(users.id, roomMembers.userId))
          .where(inArray(roomMembers.roomId, ownedIds)),
  ]);

  const byId = new Map(roomRows.map((r) => [r.id, r]));
  const sharedWithMe = memberships.flatMap((m) => {
    const r = byId.get(m.roomId);
    if (!r) {
      return [];
    }
    return [
      {
        roomId: r.id,
        name: r.name,
        glyph: r.glyph,
        role: m.role,
        ownerName: r.ownerName,
        ownerEmail: r.ownerEmail,
      },
    ];
  });

  const byRoom = new Map<string, typeof memberRows>();
  for (const m of memberRows) {
    const arr = byRoom.get(m.roomId) ?? [];
    arr.push(m);
    byRoom.set(m.roomId, arr);
  }
  const iShare = ownedRooms
    .map((r) => ({
      roomId: r.id,
      name: r.name,
      glyph: r.glyph,
      members: (byRoom.get(r.id) ?? []).map((m) => ({
        userId: m.userId,
        name: m.name,
        email: m.email,
        role: m.role,
      })),
    }))
    .filter((r) => r.members.length > 0);

  return NextResponse.json({ sharedWithMe, iShare });
}
