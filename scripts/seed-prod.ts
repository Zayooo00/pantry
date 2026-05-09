import { seedDemoData } from "./seed-shared";

async function main() {
  const url = process.env.DATABASE_URL ?? "";
  if (!url || url.startsWith("file:") || url.includes("local.db")) {
    throw new Error(
      `Refusing to seed: DATABASE_URL points at a local DB (${url || "<unset>"}). ` +
        `Export prod DATABASE_URL and DATABASE_AUTH_TOKEN, or use --env-file=.env.production.`,
    );
  }
  const password = process.env.DEMO_PASSWORD;
  if (!password || password.length < 8) {
    throw new Error(
      "Refusing to seed prod: set DEMO_PASSWORD in the environment (min 8 chars). " +
        "This is the password the demo accounts will sign in with.",
    );
  }

  const masked = url.replace(/(:\/\/[^@]*@)/, "://***@");
  console.log(`Seeding demo users on prod: ${masked}`);

  const result = await seedDemoData({ password });
  console.log(
    `Seeded ${result.users} demo users, ${result.rooms} rooms, ${result.items} items, ` +
      `pending invite token: ${result.pendingInviteToken}`,
  );
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
