import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig, devices } from "@playwright/test";

const PORT = 3650;
const BASE_URL = `http://localhost:${PORT}`;

const DB_URL = (() => {
  try {
    return readFileSync(resolve("e2e/.test-db-path"), "utf8").trim();
  } catch {
    throw new Error(
      "[e2e] Run `npm run e2e` (which seeds the test DB), not `playwright test` directly.",
    );
  }
})();

export default defineConfig({
  testDir: "./e2e",
  testIgnore: ["**/setup-db.ts", "**/global-setup.ts", "**/auth.ts"],
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 3 : 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: process.env.CI ? [["list"], ["github"]] : "list",
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npx next dev --turbopack --port ${PORT}`,
    url: BASE_URL,
    timeout: 240_000,
    reuseExistingServer: false,
    env: {
      ...process.env,
      DATABASE_URL: DB_URL,
      AUTH_SECRET: "test-secret-not-for-production-use-only-32b",
      AUTH_TRUST_HOST: "true",
      APP_URL: BASE_URL,
      E2E_BYPASS_RATE_LIMIT: "1",
    },
  },
});
