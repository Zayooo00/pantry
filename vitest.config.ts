import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    env: {
      DATABASE_URL: process.env.CI ? ":memory:" : "file:test.db",
      AUTH_SECRET: "test-secret-not-real-just-for-vitest",
    },
    include: ["tests/**/*.test.ts"],
    fileParallelism: false,
    pool: "forks",
  },
});
