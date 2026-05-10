import { beforeAll, beforeEach, afterAll } from "vitest";
import { unlinkSync, existsSync } from "node:fs";
import { sql } from "drizzle-orm";
import {
  db,
  users,
  rooms,
  roomMembers,
  roomPositions,
  items,
  shoppingItems,
  shoppingTrips,
  itemEvents,
  notifications,
  passwordResets,
  pendingInvites,
} from "@/db";
import * as schema from "@/db/schema";
import { applySchemaToSqlite } from "./schema-sync";

const TEST_DB_FILE = "test.db";

beforeAll(async () => {
  if (process.env.DATABASE_URL?.startsWith("file:") && existsSync(TEST_DB_FILE)) {
    try {
      unlinkSync(TEST_DB_FILE);
    } catch {
      // ignore - libsql may still hold a handle on Windows
    }
  }
  // Generates DDL from the live drizzle schema instead of duplicating it here,
  // so adding a new table to db/schema.ts is picked up automatically.
  await applySchemaToSqlite(schema, db);
  await db.run(sql`PRAGMA foreign_keys = ON`);
});

beforeEach(async () => {
  await db.delete(notifications);
  await db.delete(itemEvents);
  await db.delete(shoppingTrips);
  await db.delete(shoppingItems);
  await db.delete(items);
  await db.delete(pendingInvites);
  await db.delete(roomPositions);
  await db.delete(roomMembers);
  await db.delete(rooms);
  await db.delete(passwordResets);
  await db.delete(users);
});

afterAll(() => {
  // Leave test.db on disk so the dev can inspect failures; CI can clean it up.
});
