import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const DB_DIR = mkdtempSync(join(tmpdir(), "pantry-e2e-"));
const DB_FILE = join(DB_DIR, "test.db");
const NORMALIZED = DB_FILE.replace(/\\/g, "/");
const DB_URL = `file://${NORMALIZED.startsWith("/") ? NORMALIZED : `/${NORMALIZED}`}`;
const STATE_FILE = resolve("e2e/.test-db-path");
const PORT_FILE = resolve("e2e/.test-port");

function findFreePort(preferred: number): Promise<number> {
  const tryListen = (port: number) =>
    new Promise<number | null>((res) => {
      const srv = createServer();
      srv.on("error", () => res(null));
      srv.listen(port, () => {
        const addr = srv.address();
        srv.close(() => res(typeof addr === "object" && addr ? addr.port : null));
      });
    });
  return tryListen(preferred).then((p) => p ?? tryListen(0).then((q) => q ?? preferred));
}

async function main() {
  const port = await findFreePort(Number(process.env.E2E_PORT ?? 3650));
  writeFileSync(PORT_FILE, String(port));

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
}

main();
