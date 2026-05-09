import { createClient } from "@libsql/client";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("[e2e] verify-db: DATABASE_URL not set");
    process.exit(1);
  }
  const client = createClient({ url });
  const r = await client.execute("SELECT email FROM users");
  console.log(`[e2e] users in DB: ${r.rows.map((x) => x.email).join(", ")}`);
}

main().catch((err) => {
  console.error("[e2e] verify-db error:", err);
  process.exit(1);
});
