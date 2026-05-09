import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const DB_DIR = join(tmpdir(), "pantry-e2e");
const DB_FILE = join(DB_DIR, "test.db");
const DB_URL = `file:${DB_FILE.replace(/\\/g, "/")}`;
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
