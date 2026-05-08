import { sqliteTable, text, integer, real, uniqueIndex } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export type User = typeof users.$inferSelect;
export type UserInsert = typeof users.$inferInsert;

export const rooms = sqliteTable("rooms", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  glyph: text("glyph").notNull(),
  subtitle: text("subtitle"),
  tinted: integer("tinted", { mode: "boolean" }).notNull().default(false),
  position: integer("position").notNull().default(0),
  archivedAt: integer("archived_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const roomMembers = sqliteTable(
  "room_members",
  {
    id: text("id").primaryKey(),
    roomId: text("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role").notNull(),
    invitedBy: text("invited_by")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => ({
    roomUserUnique: uniqueIndex("room_members_room_user_unique").on(t.roomId, t.userId),
  }),
);

export type RoomRole = "viewer" | "editor";

export const items = sqliteTable("items", {
  id: text("id").primaryKey(),
  roomId: text("room_id")
    .notNull()
    .references(() => rooms.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  brand: text("brand"),
  category: text("category"),
  unit: text("unit").notNull(),
  count: real("count").notNull().default(0),
  threshold: real("threshold"),
  reorderAmount: real("reorder_amount"),
  shelf: text("shelf"),
  expiresAt: integer("expires_at", { mode: "timestamp" }),
  openedAt: integer("opened_at", { mode: "timestamp" }),
  purchasedAt: integer("purchased_at", { mode: "timestamp" }),
  lastPrice: real("last_price"),
  barcode: text("barcode"),
  notes: text("notes"),
  tags: text("tags"),
  photoUrl: text("photo_url"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const shoppingItems = sqliteTable("shopping_items", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  itemId: text("item_id").references(() => items.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  quantity: real("quantity").notNull().default(1),
  unit: text("unit").notNull(),
  reason: text("reason"),
  groupName: text("group_name"),
  estPrice: real("est_price"),
  done: integer("done", { mode: "boolean" }).notNull().default(false),
  source: text("source").notNull().default("manual"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const shoppingTrips = sqliteTable("shopping_trips", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  itemCount: integer("item_count").notNull().default(0),
  completedAt: integer("completed_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const itemEvents = sqliteTable("item_events", {
  id: text("id").primaryKey(),
  itemId: text("item_id")
    .notNull()
    .references(() => items.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  kind: text("kind").notNull(),
  delta: real("delta"),
  countAfter: real("count_after"),
  note: text("note"),
  actor: text("actor"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export type Room = typeof rooms.$inferSelect;
export type RoomInsert = typeof rooms.$inferInsert;
export type RoomMember = typeof roomMembers.$inferSelect;
export type RoomMemberInsert = typeof roomMembers.$inferInsert;
export type Item = typeof items.$inferSelect;
export type ItemInsert = typeof items.$inferInsert;
export type ShoppingItem = typeof shoppingItems.$inferSelect;
export type ShoppingItemInsert = typeof shoppingItems.$inferInsert;
export type ShoppingTrip = typeof shoppingTrips.$inferSelect;
export type ShoppingTripInsert = typeof shoppingTrips.$inferInsert;
export type ItemEvent = typeof itemEvents.$inferSelect;
export type ItemEventInsert = typeof itemEvents.$inferInsert;
