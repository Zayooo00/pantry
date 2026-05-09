import { db, users } from "../db";
import { sql } from "drizzle-orm";

async function main() {
  const tables = await db.run(sql`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`);
  console.log(
    "tables:",
    tables.rows.map((r) => (r as unknown as { name: string }).name),
  );
  const cols = await db.run(sql`PRAGMA table_info(users)`);
  console.log("users cols:", cols.rows);
  const all = await db.select().from(users);
  console.log("user count:", all.length);
  process.exit(0);
}

main().catch((e) => {
  console.error("ERROR:", e);
  process.exit(1);
});
