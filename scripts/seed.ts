import { seedDemoData } from "./seed-shared";

async function main() {
  console.log("Seeding pantry…");
  const password = process.env.DEMO_PASSWORD ?? "password123";
  const result = await seedDemoData({ password });
  console.log(
    `Seeded ${result.rooms} rooms (1 archived, 1 shared in), ${result.items} items, ` +
      `${result.users} users, 1 pending invite (/invite/${result.pendingInviteToken}).`,
  );
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
