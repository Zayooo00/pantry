import { seedDemoData } from "./seed-shared";

async function main() {
  const url = process.env.DATABASE_URL ?? "";
  if (!url || url.startsWith("file:") || url.includes("local.db")) {
    throw new Error(
      `Refusing to seed: DATABASE_URL points at a local DB (${url || "<unset>"}). ` +
        `Export prod DATABASE_URL and DATABASE_AUTH_TOKEN, or use --env-file=.env.production.`,
    );
  }

  const masked = url.replace(/(:\/\/[^@]*@)/, "://***@");
  console.log(`Seeding demo users on prod: ${masked}`);

  const result = await seedDemoData();
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
