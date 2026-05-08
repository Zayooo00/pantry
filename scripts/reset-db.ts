import { existsSync, rmSync } from "node:fs";
import { resolve } from "node:path";

// Only nukes a local SQLite file. If DATABASE_URL points at a remote libSQL
// (Turso) we refuse — schema migrations on prod must go through `drizzle-kit`
// explicitly so we don't accidentally wipe a hosted database.
const url = process.env.DATABASE_URL ?? "file:local.db";

if (!url.startsWith("file:")) {
  console.error(`Refusing to reset: DATABASE_URL points at "${url}".`);
  console.error("This script only nukes local SQLite files.");
  process.exit(1);
}

const filename = url.replace(/^file:/, "");
const root = process.cwd();
const targets = [filename, `${filename}-journal`, `${filename}-wal`, `${filename}-shm`];

for (const t of targets) {
  const abs = resolve(root, t);
  if (existsSync(abs)) {
    rmSync(abs, { force: true });
    console.log(`Removed ${t}`);
  }
}

console.log("Local DB nuked. Next: db:push + db:seed (run by db:reset).");
