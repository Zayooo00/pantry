import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const DB_DIR = mkdtempSync(join(tmpdir(), "pantry-e2e-"));
const DB_FILE = join(DB_DIR, "test.db");
const NORMALIZED = DB_FILE.replace(/\\/g, "/");
const DB_URL = `file://${NORMALIZED.startsWith("/") ? NORMALIZED : `/${NORMALIZED}`}`;
const STATE_FILE = resolve("e2e/.test-db-path");

const env = {
  ...process.env,
  DATABASE_URL: DB_URL,
  DATABASE_AUTH_TOKEN: "unused-for-file-url-but-required-by-drizzle-kit",
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
