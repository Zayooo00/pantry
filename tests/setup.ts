import { beforeAll, beforeEach, afterAll } from "vitest";
import { unlinkSync, existsSync } from "node:fs";
import { db, users, rooms, roomMembers, items, shoppingItems, shoppingTrips, itemEvents } from "@/db";
import { sql } from "drizzle-orm";

const TEST_DB_FILE = "test.db";

const SCHEMA_SQL = [
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`,
  `CREATE TABLE IF NOT EXISTS rooms (
    id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    glyph TEXT NOT NULL,
    subtitle TEXT,
    tinted INTEGER NOT NULL DEFAULT 0,
    position INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`,
  `CREATE TABLE IF NOT EXISTS room_members (
    id TEXT PRIMARY KEY,
    room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    invited_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS room_members_room_user_unique
    ON room_members (room_id, user_id)`,
  `CREATE TABLE IF NOT EXISTS items (
    id TEXT PRIMARY KEY,
    room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    brand TEXT,
    category TEXT,
    unit TEXT NOT NULL,
    count REAL NOT NULL DEFAULT 0,
    threshold REAL,
    reorder_amount REAL,
    shelf TEXT,
    expires_at INTEGER,
    opened_at INTEGER,
    purchased_at INTEGER,
    last_price REAL,
    barcode TEXT,
    notes TEXT,
    tags TEXT,
    photo_url TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`,
  `CREATE TABLE IF NOT EXISTS shopping_items (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_id TEXT REFERENCES items(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    quantity REAL NOT NULL DEFAULT 1,
    unit TEXT NOT NULL,
    reason TEXT,
    group_name TEXT,
    est_price REAL,
    done INTEGER NOT NULL DEFAULT 0,
    source TEXT NOT NULL DEFAULT 'manual',
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`,
  `CREATE TABLE IF NOT EXISTS shopping_trips (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_count INTEGER NOT NULL DEFAULT 0,
    completed_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`,
  `CREATE TABLE IF NOT EXISTS item_events (
    id TEXT PRIMARY KEY,
    item_id TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    kind TEXT NOT NULL,
    delta REAL,
    count_after REAL,
    note TEXT,
    actor TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`,
];

beforeAll(async () => {
  if (existsSync(TEST_DB_FILE)) {
    try {
      unlinkSync(TEST_DB_FILE);
    } catch {
      // ignore — libsql may still hold a handle on Windows
    }
  }
  for (const stmt of SCHEMA_SQL) {
    await db.run(sql.raw(stmt));
  }
  await db.run(sql`PRAGMA foreign_keys = ON`);
});

beforeEach(async () => {
  await db.delete(itemEvents);
  await db.delete(shoppingTrips);
  await db.delete(shoppingItems);
  await db.delete(items);
  await db.delete(roomMembers);
  await db.delete(rooms);
  await db.delete(users);
});

afterAll(() => {
  // Leave test.db on disk so the dev can inspect failures; CI can clean it up.
});
