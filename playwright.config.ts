import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig, devices } from "@playwright/test";

const PORT = 3200;
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
  retries: 0,
  timeout: 90_000,
  expect: { timeout: 10_000 },
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npx next dev --turbopack --port ${PORT}`,
    url: BASE_URL,
    timeout: 180_000,
    reuseExistingServer: false,
    env: {
      DATABASE_URL: DB_URL,
      DATABASE_AUTH_TOKEN: "",
      AUTH_SECRET: "test-secret-not-for-production-use-only-32b",
      AUTH_TRUST_HOST: "true",
      APP_URL: BASE_URL,
    },
  },
});
