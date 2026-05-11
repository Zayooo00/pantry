import { and, eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db, items, roomMembers, roomPositions, rooms, type Room, type RoomRole } from "@/db";
import { auth } from "@/auth";

export type AccessRole = RoomRole | "owner";

export async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }
  return session.user.id;
}

export class ForbiddenError extends Error {
  constructor() {
    super("You don't have access to this room.");
    this.name = "ForbiddenError";
  }
}

export async function getAccessibleRoomIds(userId: string): Promise<string[]> {
  const owned = await db.select({ id: rooms.id }).from(rooms).where(eq(rooms.ownerId, userId));
  const shared = await db
    .select({ id: roomMembers.roomId })
    .from(roomMembers)
    .where(eq(roomMembers.userId, userId));
  const set = new Set<string>();
  for (const r of owned) {
    set.add(r.id);
  }
  for (const r of shared) {
    set.add(r.id);
  }
  return Array.from(set);
}

export async function getRoleInRoom(userId: string, roomId: string): Promise<AccessRole | null> {
  const room = await db
    .select({ ownerId: rooms.ownerId })
    .from(rooms)
    .where(eq(rooms.id, roomId))
    .limit(1);
  if (room.length === 0) {
    return null;
  }
  if (room[0].ownerId === userId) {
    return "owner";
  }
  const member = await db
    .select({ role: roomMembers.role })
    .from(roomMembers)
    .where(and(eq(roomMembers.roomId, roomId), eq(roomMembers.userId, userId)))
    .limit(1);
  if (member.length === 0) {
    return null;
  }
  return member[0].role as RoomRole;
}

export async function canViewRoom(userId: string, roomId: string): Promise<boolean> {
  const role = await getRoleInRoom(userId, roomId);
  return role !== null;
}

export async function canEditRoom(userId: string, roomId: string): Promise<boolean> {
  const role = await getRoleInRoom(userId, roomId);
  return role === "owner" || role === "editor";
}

export async function isRoomOwner(userId: string, roomId: string): Promise<boolean> {
  const role = await getRoleInRoom(userId, roomId);
  return role === "owner";
}

export async function getRoomRolesForUser(userId: string): Promise<Map<string, AccessRole>> {
  const map = new Map<string, AccessRole>();
  const owned = await db.select({ id: rooms.id }).from(rooms).where(eq(rooms.ownerId, userId));
  for (const r of owned) {
    map.set(r.id, "owner");
  }
  const shared = await db
    .select({ id: roomMembers.roomId, role: roomMembers.role })
    .from(roomMembers)
    .where(eq(roomMembers.userId, userId));
  for (const r of shared) {
    map.set(r.id, r.role as RoomRole);
  }
  return map;
}

export async function getRoomWithRole(
  userId: string,
  roomId: string,
): Promise<{ room: Room; role: AccessRole } | null> {
  const [roomRows, memberRows] = await Promise.all([
    db.select().from(rooms).where(eq(rooms.id, roomId)).limit(1),
    db
      .select({ role: roomMembers.role })
      .from(roomMembers)
      .where(and(eq(roomMembers.roomId, roomId), eq(roomMembers.userId, userId)))
      .limit(1),
  ]);
  if (roomRows.length === 0) {
    return null;
  }
  const room = roomRows[0];
  if (room.ownerId === userId) {
    return { room, role: "owner" };
  }
  if (memberRows.length === 0) {
    return null;
  }
  return { room, role: memberRows[0].role as RoomRole };
}

export async function appendRoomPosition(userId: string, roomId: string): Promise<void> {
  const max = await db
    .select({ max: sql<number | null>`max(${roomPositions.position})` })
    .from(roomPositions)
    .where(eq(roomPositions.userId, userId));
  const nextPos = (max[0]?.max ?? -1) + 1;
  await db
    .insert(roomPositions)
    .values({ userId, roomId, position: nextPos })
    .onConflictDoNothing({ target: [roomPositions.userId, roomPositions.roomId] });
}

export async function getItemRoomId(itemId: string): Promise<string | null> {
  const row = await db
    .select({ roomId: items.roomId })
    .from(items)
    .where(eq(items.id, itemId))
    .limit(1);
  return row.length === 0 ? null : row[0].roomId;
}

export function canAttachPhotoUrl(url: string, userId: string): boolean {
  if (/^https?:\/\//.test(url)) {
    return true;
  }
  if (url.startsWith("/api/photos/")) {
    const segs = url.slice("/api/photos/".length).split("/");
    return segs[0] === "items" && segs[1] === userId;
  }
  return false;
}
