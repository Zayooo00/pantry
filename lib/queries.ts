import {
  db,
  items,
  rooms,
  roomMembers,
  roomPositions,
  shoppingItems,
  shoppingTrips,
  itemEvents,
  notifications,
  users,
} from "@/db";
import { and, asc, desc, eq, inArray, isNotNull, isNull, or, sql } from "drizzle-orm";
import { itemStatus } from "./format";
import { randomUUID } from "node:crypto";
import { canEditRoom, ForbiddenError, getAccessibleRoomIds, getItemRoomId } from "./access";

export async function getRoomsWithCounts(
  userId: string,
  opts: { includeArchived?: boolean; onlyArchived?: boolean } = {},
) {
  const accessibleIds = await getAccessibleRoomIds(userId);
  if (accessibleIds.length === 0) {
    return [];
  }
  const archivedClause = opts.onlyArchived
    ? isNotNull(rooms.archivedAt)
    : opts.includeArchived
      ? undefined
      : isNull(rooms.archivedAt);
  const rowsWithPos = await db
    .select({ room: rooms, userPos: roomPositions.position })
    .from(rooms)
    .leftJoin(
      roomPositions,
      and(eq(roomPositions.roomId, rooms.id), eq(roomPositions.userId, userId)),
    )
    .where(
      archivedClause
        ? and(inArray(rooms.id, accessibleIds), archivedClause)
        : inArray(rooms.id, accessibleIds),
    )
    .orderBy(asc(sql`coalesce(${roomPositions.position}, ${rooms.position})`));
  const all = rowsWithPos.map((r) => r.room);
  const visibleIds = all.map((r) => r.id);
  const allItems =
    visibleIds.length === 0
      ? []
      : await db.select().from(items).where(inArray(items.roomId, visibleIds));
  return all.map((r) => {
    const roomItems = allItems.filter((i) => i.roomId === r.id);
    const low = roomItems.filter(
      (i) =>
        itemStatus({ count: i.count, threshold: i.threshold, expiresAt: i.expiresAt }) === "low",
    ).length;
    const soon = roomItems.filter(
      (i) =>
        itemStatus({ count: i.count, threshold: i.threshold, expiresAt: i.expiresAt }) === "soon",
    ).length;
    return { ...r, count: roomItems.length, low, soon };
  });
}

export async function getRoom(id: string) {
  const result = await db.select().from(rooms).where(eq(rooms.id, id)).limit(1);
  return result[0] ?? null;
}

export async function getCurrentUser(userId: string) {
  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result[0] ?? null;
}

export async function getItemsForRoom(roomId: string) {
  return db.select().from(items).where(eq(items.roomId, roomId)).orderBy(desc(items.updatedAt));
}

export async function getItem(id: string) {
  const result = await db.select().from(items).where(eq(items.id, id)).limit(1);
  return result[0] ?? null;
}

export async function getAllItems(userId: string) {
  const accessibleIds = await getAccessibleRoomIds(userId);
  if (accessibleIds.length === 0) {
    return [];
  }
  const liveRooms = await db
    .select({ id: rooms.id })
    .from(rooms)
    .where(and(inArray(rooms.id, accessibleIds), isNull(rooms.archivedAt)));
  const liveIds = liveRooms.map((r) => r.id);
  if (liveIds.length === 0) {
    return [];
  }
  return db.select().from(items).where(inArray(items.roomId, liveIds));
}

export async function getDashboardData(userId: string) {
  const accessibleIds = await getAccessibleRoomIds(userId);
  if (accessibleIds.length === 0) {
    return {
      totalItems: 0,
      rooms: [],
      lowCount: 0,
      soonCount: 0,
      lowItems: [],
      soonItems: [],
      recentEvents: [],
    };
  }
  const dashRows = await db
    .select({ room: rooms })
    .from(rooms)
    .leftJoin(
      roomPositions,
      and(eq(roomPositions.roomId, rooms.id), eq(roomPositions.userId, userId)),
    )
    .where(and(inArray(rooms.id, accessibleIds), isNull(rooms.archivedAt)))
    .orderBy(asc(sql`coalesce(${roomPositions.position}, ${rooms.position})`));
  const allRooms = dashRows.map((r) => r.room);
  const liveIds = allRooms.map((r) => r.id);
  const allItems =
    liveIds.length === 0 ? [] : await db.select().from(items).where(inArray(items.roomId, liveIds));

  const enriched = allItems.map((i) => ({
    ...i,
    status: itemStatus({ count: i.count, threshold: i.threshold, expiresAt: i.expiresAt }),
  }));

  const low = enriched.filter((i) => i.status === "low");
  const soon = enriched.filter((i) => i.status === "soon");

  const roomById = new Map(allRooms.map((r) => [r.id, r]));

  const accessibleItemIds = allItems.map((i) => i.id);
  const itemById = new Map(allItems.map((i) => [i.id, i]));
  const rawRecentEvents =
    accessibleItemIds.length === 0
      ? []
      : await db
          .select()
          .from(itemEvents)
          .where(inArray(itemEvents.itemId, accessibleItemIds))
          .orderBy(desc(itemEvents.createdAt))
          .limit(8);
  const recentEvents = rawRecentEvents.map((ev) => {
    const item = itemById.get(ev.itemId);
    const room = item ? roomById.get(item.roomId) : undefined;
    return {
      ...ev,
      itemName: item?.name ?? null,
      unit: item?.unit ?? null,
      roomId: room?.id ?? null,
      roomName: room?.name ?? null,
    };
  });

  return {
    totalItems: allItems.length,
    rooms: allRooms,
    lowCount: low.length,
    soonCount: soon.length,
    lowItems: low.map((i) => ({ ...i, room: roomById.get(i.roomId) })),
    soonItems: soon
      .filter((i) => i.expiresAt)
      .sort((a, b) => a.expiresAt!.getTime() - b.expiresAt!.getTime())
      .map((i) => ({ ...i, room: roomById.get(i.roomId) })),
    recentEvents,
  };
}

export async function getShoppingItems(userId: string) {
  return db
    .select()
    .from(shoppingItems)
    .where(eq(shoppingItems.userId, userId))
    .orderBy(asc(shoppingItems.groupName), asc(shoppingItems.createdAt));
}

export async function getNextTripNumber(userId: string): Promise<number> {
  const rows = await db
    .select({ count: sql<number>`count(*)` })
    .from(shoppingTrips)
    .where(eq(shoppingTrips.userId, userId));
  return (rows[0]?.count ?? 0) + 1;
}

export async function getItemEvents(itemId: string) {
  return db
    .select()
    .from(itemEvents)
    .where(eq(itemEvents.itemId, itemId))
    .orderBy(desc(itemEvents.createdAt));
}

export async function getRecentEvents(
  userId: string,
  opts: { limit?: number; before?: Date; roomId?: string; kind?: string } = {},
) {
  const limit = opts.limit ?? 100;
  const accessibleIds = await getAccessibleRoomIds(userId);
  if (accessibleIds.length === 0) {
    return [];
  }
  const liveRooms = await db
    .select({ id: rooms.id })
    .from(rooms)
    .where(and(inArray(rooms.id, accessibleIds), isNull(rooms.archivedAt)));
  let liveIds = liveRooms.map((r) => r.id);
  if (opts.roomId) {
    if (!liveIds.includes(opts.roomId)) {
      return [];
    }
    liveIds = [opts.roomId];
  }
  if (liveIds.length === 0) {
    return [];
  }
  const conditions = [inArray(items.roomId, liveIds)];
  if (opts.before) {
    conditions.push(sql`${itemEvents.createdAt} < ${Math.floor(opts.before.getTime() / 1000)}`);
  }
  if (opts.kind) {
    conditions.push(eq(itemEvents.kind, opts.kind));
  }
  const rows = await db
    .select({
      id: itemEvents.id,
      kind: itemEvents.kind,
      delta: itemEvents.delta,
      countAfter: itemEvents.countAfter,
      note: itemEvents.note,
      actor: itemEvents.actor,
      createdAt: itemEvents.createdAt,
      itemId: itemEvents.itemId,
      itemName: items.name,
      unit: items.unit,
      roomId: rooms.id,
      roomName: rooms.name,
      roomGlyph: rooms.glyph,
    })
    .from(itemEvents)
    .leftJoin(items, eq(itemEvents.itemId, items.id))
    .leftJoin(rooms, eq(items.roomId, rooms.id))
    .where(and(...conditions))
    .orderBy(desc(itemEvents.createdAt))
    .limit(limit);
  return rows;
}

export async function searchItems(userId: string, q: string) {
  if (!q.trim()) {
    return [];
  }
  const accessibleIds = await getAccessibleRoomIds(userId);
  if (accessibleIds.length === 0) {
    return [];
  }
  const liveRooms = await db
    .select({ id: rooms.id })
    .from(rooms)
    .where(and(inArray(rooms.id, accessibleIds), isNull(rooms.archivedAt)));
  const liveIds = liveRooms.map((r) => r.id);
  if (liveIds.length === 0) {
    return [];
  }
  const escaped = q.toLowerCase().replace(/[\\%_]/g, (c) => `\\${c}`);
  const pattern = `%${escaped}%`;
  return db
    .select()
    .from(items)
    .where(
      and(
        inArray(items.roomId, liveIds),
        or(
          sql`lower(${items.name}) LIKE ${pattern} ESCAPE '\\'`,
          sql`lower(${items.brand}) LIKE ${pattern} ESCAPE '\\'`,
          sql`lower(${items.category}) LIKE ${pattern} ESCAPE '\\'`,
          sql`lower(${items.barcode}) LIKE ${pattern} ESCAPE '\\'`,
        ),
      ),
    )
    .limit(50);
}

export async function recordCountChange(args: {
  itemId: string;
  oldCount: number;
  newCount: number;
  user: { id: string; name: string };
}): Promise<void> {
  if (args.newCount === args.oldCount) {
    return;
  }
  const delta = args.newCount - args.oldCount;
  await db.insert(itemEvents).values({
    id: randomUUID(),
    itemId: args.itemId,
    userId: args.user.id,
    kind: delta > 0 ? "restock" : "consume",
    delta,
    countAfter: args.newCount,
    actor: args.user.name,
  });
}

export async function updateItemCount(
  id: string,
  newCount: number,
  user: { id: string; name: string },
) {
  const existing = await getItem(id);
  if (!existing) {
    throw new Error("Item not found");
  }
  await db.update(items).set({ count: newCount, updatedAt: new Date() }).where(eq(items.id, id));
  await recordCountChange({ itemId: id, oldCount: existing.count, newCount, user });
  await maybeNotifyThresholdCross({
    itemId: id,
    itemName: existing.name,
    roomId: existing.roomId,
    oldThreshold: existing.threshold,
    newThreshold: existing.threshold,
    oldCount: existing.count,
    newCount,
    actorId: user.id,
    actorName: user.name,
  });
}

export async function maybeNotifyThresholdCross(args: {
  itemId: string;
  itemName: string;
  roomId: string;
  oldThreshold: number | null;
  newThreshold: number | null;
  oldCount: number;
  newCount: number;
  actorId: string | null;
  actorName: string | null;
}): Promise<void> {
  const wasBelow = args.oldThreshold != null && args.oldCount < args.oldThreshold;
  const isBelow = args.newThreshold != null && args.newCount < args.newThreshold;
  if (!isBelow || wasBelow) {
    return;
  }
  const room = await db
    .select({ ownerId: rooms.ownerId, name: rooms.name })
    .from(rooms)
    .where(eq(rooms.id, args.roomId))
    .limit(1);
  if (room.length === 0) {
    return;
  }
  const members = await db
    .select({ userId: roomMembers.userId })
    .from(roomMembers)
    .where(eq(roomMembers.roomId, args.roomId));
  const recipients = new Set<string>([room[0].ownerId, ...members.map((m) => m.userId)]);
  if (args.actorId) {
    recipients.delete(args.actorId);
  }
  if (recipients.size === 0) {
    return;
  }
  const now = new Date();
  const inserts = Array.from(recipients).map((userId) => ({
    id: randomUUID(),
    userId,
    kind: "low_threshold_crossed",
    title: `${args.itemName} dropped below the floor`,
    body: args.actorName
      ? `${args.actorName} brought it to ${args.newCount} (floor: ${args.newThreshold}) in ${room[0].name}.`
      : `Now at ${args.newCount} (floor: ${args.newThreshold}) in ${room[0].name}.`,
    link: `/items/${args.itemId}`,
    itemId: args.itemId,
    roomId: args.roomId,
    createdAt: now,
  }));
  await db.insert(notifications).values(inserts);
}

export async function addToShoppingList(itemId: string, userId: string) {
  const item = await getItem(itemId);
  if (!item) {
    throw new Error("Item not found");
  }
  const roomId = await getItemRoomId(itemId);
  if (!roomId) {
    throw new Error("Item not found");
  }
  const allowed = await canEditRoom(userId, roomId);
  if (!allowed) {
    throw new ForbiddenError();
  }
  const existing = await db
    .select()
    .from(shoppingItems)
    .where(
      and(
        eq(shoppingItems.userId, userId),
        eq(shoppingItems.itemId, itemId),
        eq(shoppingItems.done, false),
      ),
    )
    .limit(1);
  if (existing.length > 0) {
    return existing[0];
  }
  const groupForCategory = (cat: string | null) => {
    if (!cat) {
      return "Other";
    }
    const c = cat.toLowerCase();
    if (c.includes("oil") || c.includes("vinegar") || c.includes("condiment")) {
      return "Oils & condiments";
    }
    if (c.includes("grain") || c.includes("bak")) {
      return "Dry goods";
    }
    if (c.includes("dairy") || c.includes("cold") || c.includes("frozen")) {
      return "Cold & dairy";
    }
    if (c.includes("produce") || c.includes("fruit") || c.includes("veg")) {
      return "Produce";
    }
    return cat;
  };
  const reason = item.threshold
    ? `${item.shelf ?? ""} · LOW · ${item.count} / ${item.threshold} ${item.unit}`.trim()
    : "MANUAL";
  const newRow = {
    id: randomUUID(),
    userId,
    itemId: item.id,
    name: item.name,
    quantity: item.reorderAmount ?? Math.max(1, (item.threshold ?? 1) * 2),
    unit: item.unit,
    reason,
    groupName: groupForCategory(item.category),
    estPrice: item.lastPrice ?? null,
    done: false,
    source: "auto",
  };
  await db.insert(shoppingItems).values(newRow);
  return newRow;
}
