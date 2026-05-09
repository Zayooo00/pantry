import { db, items, shoppingItems, shoppingTrips, users } from "../db";
import { and, eq, inArray, isNull, count } from "drizzle-orm";
import { randomUUID } from "node:crypto";

async function applyDeltas() {
  const alex = await db
    .select()
    .from(users)
    .where(eq(users.email, "alex@pantry.local"))
    .limit(1);
  if (alex.length === 0) {
    console.error("alex@pantry.local not found — run the main seed first.");
    process.exit(1);
  }
  const alexId = alex[0].id;

  const photoUrl = "https://picsum.photos/seed/pantry-frantoio/800/600";
  const photoUpdate = await db
    .update(items)
    .set({ photoUrl })
    .where(
      and(
        eq(items.roomId, "kitchen"),
        eq(items.name, "Frantoio olive oil"),
        isNull(items.photoUrl),
      ),
    )
    .returning({ id: items.id });
  console.log(`photoUrl set on ${photoUpdate.length} olive oil(s).`);

  const doneUpdate = await db
    .update(shoppingItems)
    .set({ done: true })
    .where(
      and(
        eq(shoppingItems.userId, alexId),
        eq(shoppingItems.source, "manual"),
        eq(shoppingItems.done, false),
        inArray(shoppingItems.name, ["Parchment paper", "Whole-milk ricotta"]),
      ),
    )
    .returning({ name: shoppingItems.name });
  console.log(`Marked done: ${doneUpdate.map((r) => r.name).join(", ") || "(none)"}`);

  const tripCount = await db
    .select({ n: count() })
    .from(shoppingTrips)
    .where(eq(shoppingTrips.userId, alexId));
  if ((tripCount[0]?.n ?? 0) === 0) {
    const today = new Date();
    const day = (offset: number) => {
      const d = new Date(today);
      d.setDate(d.getDate() + offset);
      return d;
    };
    await db.insert(shoppingTrips).values([
      { id: randomUUID(), userId: alexId, itemCount: 8, completedAt: day(-7) },
      { id: randomUUID(), userId: alexId, itemCount: 5, completedAt: day(-14) },
      { id: randomUUID(), userId: alexId, itemCount: 11, completedAt: day(-22) },
    ]);
    console.log("Inserted 3 historical shopping trips.");
  } else {
    console.log(`Skipping trips — Alex already has ${tripCount[0].n}.`);
  }

  process.exit(0);
}

applyDeltas().catch((err) => {
  console.error(err);
  process.exit(1);
});
