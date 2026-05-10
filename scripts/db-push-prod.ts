import { spawnSync } from "node:child_process";

const url = process.env.DATABASE_URL ?? "";
if (!url || url.startsWith("file:") || url.includes("local.db")) {
  throw new Error(
    `Refusing to push: DATABASE_URL points at a local DB (${url || "<unset>"}). ` +
      `Use --env-file=.env.production (npm run db:push:prod loads it for you).`,
  );
}

const masked = url.replace(/(:\/\/[^@]*@)/, "://***@");
console.log(`drizzle-kit push -> ${masked}`);

const result = spawnSync("npx", ["drizzle-kit", "push"], {
  stdio: "inherit",
  shell: true,
  env: process.env,
});
process.exit(result.status ?? 1);
