import { and, eq, inArray, or } from "drizzle-orm";
import { db, items, roomMembers, rooms, type Room, type RoomRole } from "@/db";
import { auth } from "@/auth";

export type AccessRole = RoomRole | "owner";

export async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new UnauthorizedError();
  }
  return session.user.id;
}

export class UnauthorizedError extends Error {
  constructor() {
    super("Not signed in.");
    this.name = "UnauthorizedError";
  }
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

export async function getItemRoomId(itemId: string): Promise<string | null> {
  const row = await db
    .select({ roomId: items.roomId })
    .from(items)
    .where(eq(items.id, itemId))
    .limit(1);
  return row.length === 0 ? null : row[0].roomId;
}

export async function getAccessibleRoomsCondition(userId: string) {
  const owned = db.select({ id: rooms.id }).from(rooms).where(eq(rooms.ownerId, userId));
  const member = db
    .select({ id: roomMembers.roomId })
    .from(roomMembers)
    .where(eq(roomMembers.userId, userId));
  return or(inArray(rooms.id, owned), inArray(rooms.id, member));
}
