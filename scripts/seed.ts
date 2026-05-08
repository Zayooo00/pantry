import { db, items, rooms, roomMembers, shoppingItems, itemEvents, users } from "../db";
import { randomUUID } from "node:crypto";
import { hashPassword } from "../lib/password";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("Seeding pantry…");

  await db.delete(itemEvents);
  await db.delete(shoppingItems);
  await db.delete(items);
  await db.delete(roomMembers);
  await db.delete(rooms);

  const existing = await db.select().from(users).where(eq(users.email, "alex@pantry.local")).limit(1);
  let demoUserId: string;
  if (existing.length === 0) {
    demoUserId = randomUUID();
    await db.insert(users).values({
      id: demoUserId,
      email: "alex@pantry.local",
      name: "Alex Hsu",
      passwordHash: await hashPassword("password123"),
    });
    console.log("Created demo user: alex@pantry.local / password123");
  } else {
    demoUserId = existing[0].id;
  }

  const roomData = [
    { id: "pantry", ownerId: demoUserId, name: "Pantry", glyph: "pantry", subtitle: "Main staples — dry goods, oils, condiments.", tinted: false, position: 0 },
    { id: "basement", ownerId: demoUserId, name: "Basement", glyph: "basement", subtitle: "Long-term storage — preserves, paper, wine.", tinted: true, position: 1 },
    { id: "kitchen", ownerId: demoUserId, name: "Kitchen", glyph: "kitchen", subtitle: "Daily reach — coffee, salt, bread.", tinted: false, position: 2 },
    { id: "fridge", ownerId: demoUserId, name: "Fridge", glyph: "fridge", subtitle: "Cold — dairy, produce, leftovers.", tinted: false, position: 3 },
    { id: "freezer", ownerId: demoUserId, name: "Freezer", glyph: "freezer", subtitle: "Frozen — proteins, ice, doughs.", tinted: false, position: 4 },
    { id: "spice", ownerId: demoUserId, name: "Spice rack", glyph: "spice", subtitle: "Spices, dried herbs, infusions.", tinted: false, position: 5 },
    { id: "garage", ownerId: demoUserId, name: "Garage", glyph: "garage", subtitle: "Backstock — bulk paper, water, oils.", tinted: false, position: 6 },
  ];
  await db.insert(rooms).values(roomData);

  const today = new Date();
  const day = (offsetDays: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offsetDays);
    return d;
  };

  const itemData = [
    { roomId: "pantry", name: "San Marzano tomatoes", brand: "Cento", category: "Canned", unit: "tins", count: 12, threshold: 6, shelf: "B-04", lastPrice: 3.50 },
    { roomId: "pantry", name: "Arborio rice", category: "Grains", unit: "kg", count: 1.4, threshold: 1, shelf: "A-08", lastPrice: 8.00 },
    { roomId: "pantry", name: "00 pizza flour", brand: "Caputo", category: "Grains", unit: "kg", count: 0.5, threshold: 2, reorderAmount: 2, shelf: "A-04", lastPrice: 4.00 },
    { roomId: "pantry", name: "Maldon sea salt", category: "Spices", unit: "box", count: 1, threshold: 1, shelf: "C-12" },
    { roomId: "pantry", name: "Kikkoman soy sauce", category: "Oils & vinegars", unit: "btl", count: 1, threshold: 2, reorderAmount: 2, shelf: "C-02", lastPrice: 5.50 },
    { roomId: "pantry", name: "Chickpeas, dried", category: "Grains", unit: "bags", count: 3, threshold: 2, shelf: "A-11", lastPrice: 3.75 },
    { roomId: "pantry", name: "Maple syrup, dark", category: "Preserves", unit: "btl", count: 2, threshold: 1, shelf: "D-03" },
    { roomId: "pantry", name: "Fennel seeds", category: "Spices", unit: "g", count: 80, threshold: 30, shelf: "C-08" },
    { roomId: "pantry", name: "Anchovies in oil", category: "Canned", unit: "tins", count: 5, threshold: 2, shelf: "B-06" },
    { roomId: "pantry", name: "Apricot preserves", category: "Preserves", unit: "jars", count: 4, threshold: 1, shelf: "D-08" },
    { roomId: "pantry", name: "Active dry yeast", category: "Baking", unit: "pkts", count: 4, threshold: 4, shelf: "E-01" },
    { roomId: "pantry", name: "Toasted sesame oil", category: "Oils & vinegars", unit: "ml", count: 200, threshold: 100, shelf: "C-03" },
    { roomId: "pantry", name: "Sunflower oil", category: "Oils & vinegars", unit: "L", count: 1.5, threshold: 1, shelf: "C-04" },
    { roomId: "pantry", name: "Coconut oil, refined", category: "Oils & vinegars", unit: "g", count: 450, threshold: 200, shelf: "C-06" },
    { roomId: "pantry", name: "Ghee", category: "Oils & vinegars", unit: "jars", count: 1, threshold: 1, shelf: "C-07" },
    { roomId: "pantry", name: "White truffle oil", category: "Oils & vinegars", unit: "ml", count: 90, threshold: 30, shelf: "C-09" },
    { roomId: "kitchen", name: "Frantoio olive oil", brand: "Az. Agr. Pruneti", category: "Oils & vinegars", unit: "L", count: 0.4, threshold: 1, reorderAmount: 2, shelf: "Top shelf", expiresAt: day(99), openedAt: day(-10), purchasedAt: day(-12), lastPrice: 24.50, barcode: "8014203778124", notes: "From the Tuscan trip — picked it up at the mill near Greve. Keep out of light.", tags: "Imported,Unfiltered,Extra virgin" },
    { roomId: "kitchen", name: "Coffee beans", brand: "Heart", category: "Drinks", unit: "g", count: 250, threshold: 200, shelf: "Counter" },
    { roomId: "kitchen", name: "Sourdough loaf", category: "Baking", unit: "ea", count: 1, threshold: 1, shelf: "Bread box", expiresAt: day(2) },
    { roomId: "basement", name: "Garbanzo, dried", category: "Grains", unit: "bags", count: 1, threshold: 3, reorderAmount: 2, shelf: "B-12", lastPrice: 3.75 },
    { roomId: "basement", name: "Everyday EVOO, big jug", category: "Oils & vinegars", unit: "L", count: 3, threshold: 1, shelf: "B-02" },
    { roomId: "basement", name: "Tomato passata", category: "Canned", unit: "btl", count: 8, threshold: 4, shelf: "B-05" },
    { roomId: "fridge", name: "Cultured butter, salted", category: "Dairy", unit: "sticks", count: 1, threshold: 3, reorderAmount: 2, shelf: "Middle", expiresAt: day(28), lastPrice: 3.20 },
    { roomId: "fridge", name: "Active dry yeast", category: "Baking", unit: "pkts", count: 2, threshold: 4, reorderAmount: 2, shelf: "Door", expiresAt: day(60), lastPrice: 1.00 },
    { roomId: "fridge", name: "Cilantro, fresh", category: "Produce", unit: "bunch", count: 1, threshold: 1, shelf: "Crisper", expiresAt: day(4), lastPrice: 1.99 },
    { roomId: "fridge", name: "Sourdough starter", category: "Baking", unit: "jar", count: 1, threshold: 1, shelf: "Door", expiresAt: day(6) },
    { roomId: "fridge", name: "Whole milk", category: "Dairy", unit: "L", count: 1, threshold: 1, shelf: "Top", expiresAt: day(9) },
    { roomId: "fridge", name: "Greek yogurt", category: "Dairy", unit: "jar", count: 1, threshold: 1, shelf: "Top", expiresAt: day(12) },
    { roomId: "fridge", name: "Chili oil, lao gan ma", category: "Oils & vinegars", unit: "jar", count: 1, threshold: 1, shelf: "Door" },
    { roomId: "freezer", name: "Pizza dough", category: "Baking", unit: "balls", count: 4, threshold: 2 },
    { roomId: "freezer", name: "Salmon fillets", category: "Frozen", unit: "ea", count: 6, threshold: 2 },
    { roomId: "spice", name: "Aleppo pepper", category: "Spices", unit: "g", count: 60, threshold: 20 },
    { roomId: "spice", name: "Smoked paprika", category: "Spices", unit: "g", count: 45, threshold: 20 },
    { roomId: "spice", name: "Black peppercorns", category: "Spices", unit: "g", count: 120, threshold: 30 },
    { roomId: "garage", name: "Bulk olive oil tin", category: "Oils & vinegars", unit: "L", count: 5, threshold: 1 },
  ];

  const enriched = itemData.map((d) => ({
    id: randomUUID(),
    roomId: d.roomId,
    name: d.name,
    brand: d.brand ?? null,
    category: d.category ?? null,
    unit: d.unit,
    count: d.count,
    threshold: d.threshold ?? null,
    reorderAmount: d.reorderAmount ?? null,
    shelf: d.shelf ?? null,
    expiresAt: d.expiresAt ?? null,
    openedAt: d.openedAt ?? null,
    purchasedAt: d.purchasedAt ?? null,
    lastPrice: d.lastPrice ?? null,
    barcode: d.barcode ?? null,
    notes: d.notes ?? null,
    tags: d.tags ?? null,
    photoUrl: null,
    createdAt: today,
    updatedAt: today,
  }));

  for (const it of enriched) {
    await db.insert(items).values(it);
    await db.insert(itemEvents).values({
      id: randomUUID(),
      itemId: it.id,
      userId: demoUserId,
      kind: "created",
      countAfter: it.count,
      actor: "Alex",
      createdAt: today,
    });
  }

  const oliveOil = enriched.find((i) => i.name.includes("Frantoio"));
  if (oliveOil) {
    await db.insert(itemEvents).values([
      { id: randomUUID(), itemId: oliveOil.id, userId: null, kind: "low_threshold_crossed", countAfter: 0.4, actor: "auto", createdAt: day(-1) },
      { id: randomUUID(), itemId: oliveOil.id, userId: demoUserId, kind: "consume", delta: -0.05, countAfter: 0.4, actor: "Maya", createdAt: day(-3) },
      { id: randomUUID(), itemId: oliveOil.id, userId: demoUserId, kind: "opened", countAfter: 1.0, actor: "Alex", createdAt: day(-10) },
      { id: randomUUID(), itemId: oliveOil.id, userId: demoUserId, kind: "restock", delta: 1.0, countAfter: 1.0, actor: "Alex", note: "Olive Tree Grocers", createdAt: day(-12) },
    ]);
  }

  for (const it of enriched) {
    if (it.threshold && it.count < it.threshold) {
      const groupForCategory = (cat: string | null) => {
        if (!cat) {
          return "Other";
        }
        const c = cat.toLowerCase();
        if (c.includes("oil") || c.includes("vinegar") || c.includes("condiment")) {
          return "Oils & condiments";
        }
        if (c.includes("grain") || c.includes("bak")) {
          return "Dry goods";
        }
        if (c.includes("dairy") || c.includes("frozen")) {
          return "Cold & dairy";
        }
        if (c.includes("produce")) {
          return "Produce";
        }
        return cat;
      };
      const room = roomData.find((r) => r.id === it.roomId);
      await db.insert(shoppingItems).values({
        id: randomUUID(),
        userId: demoUserId,
        itemId: it.id,
        name: it.name,
        quantity: it.reorderAmount ?? Math.max(1, it.threshold * 2),
        unit: it.unit,
        reason: `${(room?.name ?? "").toUpperCase()}${it.shelf ? ` · ${it.shelf}` : ""} · LOW · ${it.count} / ${it.threshold} ${it.unit}`,
        groupName: groupForCategory(it.category),
        estPrice: it.lastPrice ?? null,
        done: false,
        source: "auto",
      });
    }
  }
  await db.insert(shoppingItems).values({
    id: randomUUID(),
    userId: demoUserId,
    itemId: null,
    name: "Lemons",
    quantity: 4,
    unit: "ea",
    reason: "MANUAL · MAYA",
    groupName: "Produce",
    estPrice: 2.40,
    done: true,
    source: "manual",
  });

  console.log(`Seeded ${roomData.length} rooms, ${enriched.length} items.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
