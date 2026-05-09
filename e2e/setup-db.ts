import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const DB_DIR = join(tmpdir(), "pantry-e2e");
const DB_FILE = join(DB_DIR, "test.db");
const NORMALIZED = DB_FILE.replace(/\\/g, "/");
const DB_URL = `file://${NORMALIZED.startsWith("/") ? NORMALIZED : `/${NORMALIZED}`}`;
const STATE_FILE = resolve("e2e/.test-db-path");

if (!existsSync(DB_DIR)) {
  mkdirSync(DB_DIR, { recursive: true });
}

for (const f of [DB_FILE, `${DB_FILE}-journal`]) {
  if (existsSync(f)) {
    try {
      unlinkSync(f);
    } catch (err) {
      console.error(`[e2e] could not remove ${f} — close any running e2e server and retry.`);
      throw err;
    }
  }
}

const env = {
  ...process.env,
  DATABASE_URL: DB_URL,
  DATABASE_AUTH_TOKEN: "test-token-unused-for-local-file",
};

const push = spawnSync("npx", ["drizzle-kit", "push", "--force"], {
  env,
  stdio: "inherit",
  shell: true,
});
if (push.status !== 0) {
  process.exit(push.status ?? 1);
}

const seed = spawnSync("npx", ["tsx", "scripts/seed.ts"], {
  env,
  stdio: "inherit",
  shell: true,
});
if (seed.status !== 0) {
  process.exit(seed.status ?? 1);
}

writeFileSync(STATE_FILE, DB_URL);
console.log(`[e2e] DATABASE_URL=${DB_URL}`);

const verify = spawnSync(
  "npx",
  [
    "tsx",
    "-e",
    `import { createClient } from "@libsql/client"; const c = createClient({ url: "${DB_URL}" }); const r = await c.execute("SELECT email FROM users"); console.log("[e2e] users:", r.rows.map(x => x.email).join(", "));`,
  ],
  { env, stdio: "inherit", shell: true },
);
if (verify.status !== 0) {
  console.error("[e2e] WARNING: could not read users back from seeded DB");
}
