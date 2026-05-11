import {
  db,
  items,
  rooms,
  roomMembers,
  roomPositions,
  shoppingItems,
  shoppingTrips,
  itemEvents,
  notifications,
  pendingInvites,
  passwordResets,
  users,
} from "../db";
import { randomUUID } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import { hashPassword } from "../lib/password";
import { generateToken, hashToken } from "../lib/tokens";

export const DEMO_EMAILS = ["alex@pantry.local", "maya@pantry.local", "nora@pantry.local"] as const;

const DEMO_PROFILES = [
  { email: "alex@pantry.local", name: "Alex Hsu" },
  { email: "maya@pantry.local", name: "Maya Hsu" },
  { email: "nora@pantry.local", name: "Nora Park" },
];

type SeedResult = {
  rooms: number;
  items: number;
  users: number;
  pendingInviteToken: string;
};

export async function seedDemoData(opts: { password: string }): Promise<SeedResult> {
  const DEMO_USERS = DEMO_PROFILES.map((p) => ({ ...p, password: opts.password }));
  const userIdByEmail = new Map<string, string>();
  for (const u of DEMO_USERS) {
    const existing = await db.select().from(users).where(eq(users.email, u.email)).limit(1);
    if (existing.length > 0) {
      userIdByEmail.set(u.email, existing[0].id);
      continue;
    }
    const id = randomUUID();
    await db.insert(users).values({
      id,
      email: u.email,
      name: u.name,
      passwordHash: await hashPassword(u.password),
      emailVerifiedAt: new Date(),
      notifyDigest: u.email === "alex@pantry.local" ? "weekly" : "off",
    });
    userIdByEmail.set(u.email, id);
    console.log(`Created user: ${u.email} / ${u.password}`);
  }

  const demoIds = [...userIdByEmail.values()];
  await db.delete(notifications).where(inArray(notifications.userId, demoIds));
  await db.delete(shoppingItems).where(inArray(shoppingItems.userId, demoIds));
  await db.delete(shoppingTrips).where(inArray(shoppingTrips.userId, demoIds));
  await db.delete(passwordResets).where(inArray(passwordResets.userId, demoIds));
  await db.delete(pendingInvites).where(inArray(pendingInvites.invitedBy, demoIds));
  await db.delete(roomPositions).where(inArray(roomPositions.userId, demoIds));
  await db.delete(roomMembers).where(inArray(roomMembers.userId, demoIds));
  await db.delete(rooms).where(inArray(rooms.ownerId, demoIds));
  const alexId = userIdByEmail.get("alex@pantry.local")!;
  const mayaId = userIdByEmail.get("maya@pantry.local")!;
  const noraId = userIdByEmail.get("nora@pantry.local")!;

  const today = new Date();
  const day = (offsetDays: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offsetDays);
    return d;
  };

  const roomData = [
    {
      id: "pantry",
      ownerId: alexId,
      name: "Pantry",
      glyph: "pantry",
      subtitle: "Main staples — dry goods, oils, condiments.",
      tinted: false,
      position: 0,
      archivedAt: null,
    },
    {
      id: "basement",
      ownerId: alexId,
      name: "Basement",
      glyph: "basement",
      subtitle: "Long-term storage — preserves, paper, wine.",
      tinted: true,
      position: 1,
      archivedAt: null,
    },
    {
      id: "kitchen",
      ownerId: alexId,
      name: "Kitchen",
      glyph: "kitchen",
      subtitle: "Daily reach — coffee, salt, bread.",
      tinted: false,
      position: 2,
      archivedAt: null,
    },
    {
      id: "fridge",
      ownerId: alexId,
      name: "Fridge",
      glyph: "fridge",
      subtitle: "Cold — dairy, produce, leftovers.",
      tinted: false,
      position: 3,
      archivedAt: null,
    },
    {
      id: "freezer",
      ownerId: alexId,
      name: "Freezer",
      glyph: "freezer",
      subtitle: "Frozen — proteins, ice, doughs.",
      tinted: false,
      position: 4,
      archivedAt: null,
    },
    {
      id: "spice",
      ownerId: alexId,
      name: "Spice rack",
      glyph: "spice",
      subtitle: "Spices, dried herbs, infusions.",
      tinted: false,
      position: 5,
      archivedAt: null,
    },
    {
      id: "garage",
      ownerId: alexId,
      name: "Garage",
      glyph: "garage",
      subtitle: "Backstock — bulk paper, water, oils.",
      tinted: false,
      position: 6,
      archivedAt: null,
    },
    {
      id: "old-cellar",
      ownerId: alexId,
      name: "Wine cellar (old)",
      glyph: "basement",
      subtitle: "Replaced by the new basement racks.",
      tinted: false,
      position: 7,
      archivedAt: day(-30),
    },
    {
      id: "maya-pantry",
      ownerId: mayaId,
      name: "Maya's pantry",
      glyph: "pantry",
      subtitle: "Home-made jams and bakes.",
      tinted: false,
      position: 0,
      archivedAt: null,
    },
  ];
  await db.insert(rooms).values(roomData);

  await db.insert(roomMembers).values([
    { id: randomUUID(), roomId: "pantry", userId: mayaId, role: "editor", invitedBy: alexId },
    { id: randomUUID(), roomId: "fridge", userId: mayaId, role: "editor", invitedBy: alexId },
    { id: randomUUID(), roomId: "kitchen", userId: noraId, role: "viewer", invitedBy: alexId },
    { id: randomUUID(), roomId: "maya-pantry", userId: alexId, role: "editor", invitedBy: mayaId },
  ]);

  const alexRoomOrder = [
    "pantry",
    "basement",
    "kitchen",
    "fridge",
    "freezer",
    "spice",
    "garage",
    "old-cellar",
    "maya-pantry",
  ];
  const mayaRoomOrder = ["maya-pantry", "pantry", "fridge"];
  const noraRoomOrder = ["kitchen"];
  await db
    .insert(roomPositions)
    .values([
      ...alexRoomOrder.map((roomId, position) => ({ userId: alexId, roomId, position })),
      ...mayaRoomOrder.map((roomId, position) => ({ userId: mayaId, roomId, position })),
      ...noraRoomOrder.map((roomId, position) => ({ userId: noraId, roomId, position })),
    ]);

  const inviteToken = generateToken();
  await db.insert(pendingInvites).values({
    id: randomUUID(),
    roomId: "basement",
    email: "friend@example.com",
    role: "viewer",
    tokenHash: hashToken(inviteToken),
    invitedBy: alexId,
    expiresAt: day(14),
  });

  const itemData = [
    {
      roomId: "pantry",
      name: "San Marzano tomatoes",
      brand: "Cento",
      category: "Canned",
      unit: "tins",
      count: 12,
      threshold: 6,
      shelf: "B-04",
      lastPrice: 3.5,
      barcode: "0070303081012",
    },
    {
      roomId: "pantry",
      name: "Arborio rice",
      category: "Grains",
      unit: "kg",
      count: 1.4,
      threshold: 1,
      shelf: "A-08",
      lastPrice: 8.0,
    },
    {
      roomId: "pantry",
      name: "00 pizza flour",
      brand: "Caputo",
      category: "Grains",
      unit: "kg",
      count: 0.5,
      threshold: 2,
      reorderAmount: 2,
      shelf: "A-04",
      lastPrice: 4.0,
      tags: "Imported,Italy",
    },
    {
      roomId: "pantry",
      name: "Maldon sea salt",
      category: "Spices",
      unit: "box",
      count: 1,
      threshold: 1,
      shelf: "C-12",
    },
    {
      roomId: "pantry",
      name: "Kikkoman soy sauce",
      category: "Oils & vinegars",
      unit: "btl",
      count: 1,
      threshold: 2,
      reorderAmount: 2,
      shelf: "C-02",
      lastPrice: 5.5,
    },
    {
      roomId: "pantry",
      name: "Chickpeas, dried",
      category: "Grains",
      unit: "bags",
      count: 3,
      threshold: 2,
      shelf: "A-11",
      lastPrice: 3.75,
    },
    {
      roomId: "pantry",
      name: "Maple syrup, dark",
      category: "Preserves",
      unit: "btl",
      count: 2,
      threshold: 1,
      shelf: "D-03",
    },
    {
      roomId: "pantry",
      name: "Fennel seeds",
      category: "Spices",
      unit: "g",
      count: 80,
      threshold: 30,
      shelf: "C-08",
    },
    {
      roomId: "pantry",
      name: "Anchovies in oil",
      category: "Canned",
      unit: "tins",
      count: 5,
      threshold: 2,
      shelf: "B-06",
      expiresAt: day(8),
    },
    {
      roomId: "pantry",
      name: "Apricot preserves",
      category: "Preserves",
      unit: "jars",
      count: 4,
      threshold: 1,
      shelf: "D-08",
    },
    {
      roomId: "pantry",
      name: "Active dry yeast",
      category: "Baking",
      unit: "pkts",
      count: 4,
      threshold: 4,
      shelf: "E-01",
    },
    {
      roomId: "pantry",
      name: "Toasted sesame oil",
      category: "Oils & vinegars",
      unit: "ml",
      count: 200,
      threshold: 100,
      shelf: "C-03",
    },
    {
      roomId: "pantry",
      name: "Sunflower oil",
      category: "Oils & vinegars",
      unit: "L",
      count: 1.5,
      threshold: 1,
      shelf: "C-04",
    },
    {
      roomId: "pantry",
      name: "Coconut oil, refined",
      category: "Oils & vinegars",
      unit: "g",
      count: 450,
      threshold: 200,
      shelf: "C-06",
    },
    {
      roomId: "pantry",
      name: "Ghee",
      category: "Oils & vinegars",
      unit: "jars",
      count: 1,
      threshold: 1,
      shelf: "C-07",
    },
    {
      roomId: "pantry",
      name: "White truffle oil",
      category: "Oils & vinegars",
      unit: "ml",
      count: 90,
      threshold: 30,
      shelf: "C-09",
    },
    {
      roomId: "kitchen",
      name: "Frantoio olive oil",
      brand: "Az. Agr. Pruneti",
      category: "Oils & vinegars",
      unit: "L",
      count: 0.4,
      threshold: 1,
      reorderAmount: 2,
      shelf: "Top shelf",
      expiresAt: day(99),
      openedAt: day(-10),
      purchasedAt: day(-12),
      lastPrice: 24.5,
      barcode: "8014203778124",
      notes: "From the Tuscan trip — picked it up at the mill near Greve. Keep out of light.",
      tags: "Imported,Unfiltered,Extra virgin",
      photoUrl: "https://picsum.photos/seed/pantry-frantoio/800/600",
    },
    {
      roomId: "kitchen",
      name: "Coffee beans",
      brand: "Heart",
      category: "Drinks",
      unit: "g",
      count: 250,
      threshold: 200,
      shelf: "Counter",
    },
    {
      roomId: "kitchen",
      name: "Sourdough loaf",
      category: "Baking",
      unit: "ea",
      count: 1,
      threshold: 1,
      shelf: "Bread box",
      expiresAt: day(2),
    },
    {
      roomId: "basement",
      name: "Garbanzo, dried",
      category: "Grains",
      unit: "bags",
      count: 1,
      threshold: 3,
      reorderAmount: 2,
      shelf: "B-12",
      lastPrice: 3.75,
    },
    {
      roomId: "basement",
      name: "Everyday EVOO, big jug",
      category: "Oils & vinegars",
      unit: "L",
      count: 3,
      threshold: 1,
      shelf: "B-02",
    },
    {
      roomId: "basement",
      name: "Tomato passata",
      category: "Canned",
      unit: "btl",
      count: 8,
      threshold: 4,
      shelf: "B-05",
    },
    {
      roomId: "fridge",
      name: "Cultured butter, salted",
      category: "Dairy",
      unit: "sticks",
      count: 1,
      threshold: 3,
      reorderAmount: 2,
      shelf: "Middle",
      expiresAt: day(28),
      lastPrice: 3.2,
    },
    {
      roomId: "fridge",
      name: "Active dry yeast",
      category: "Baking",
      unit: "pkts",
      count: 2,
      threshold: 4,
      reorderAmount: 2,
      shelf: "Door",
      expiresAt: day(60),
      lastPrice: 1.0,
    },
    {
      roomId: "fridge",
      name: "Cilantro, fresh",
      category: "Produce",
      unit: "bunch",
      count: 1,
      threshold: 1,
      shelf: "Crisper",
      expiresAt: day(4),
      lastPrice: 1.99,
    },
    {
      roomId: "fridge",
      name: "Sourdough starter",
      category: "Baking",
      unit: "jar",
      count: 1,
      threshold: 1,
      shelf: "Door",
      expiresAt: day(6),
    },
    {
      roomId: "fridge",
      name: "Whole milk",
      category: "Dairy",
      unit: "L",
      count: 1,
      threshold: 1,
      shelf: "Top",
      expiresAt: day(9),
    },
    {
      roomId: "fridge",
      name: "Greek yogurt",
      category: "Dairy",
      unit: "jar",
      count: 1,
      threshold: 1,
      shelf: "Top",
      expiresAt: day(12),
    },
    {
      roomId: "fridge",
      name: "Chili oil, lao gan ma",
      category: "Oils & vinegars",
      unit: "jar",
      count: 1,
      threshold: 1,
      shelf: "Door",
    },
    {
      roomId: "freezer",
      name: "Pizza dough",
      category: "Baking",
      unit: "balls",
      count: 4,
      threshold: 2,
    },
    {
      roomId: "freezer",
      name: "Salmon fillets",
      category: "Frozen",
      unit: "ea",
      count: 6,
      threshold: 2,
    },
    {
      roomId: "spice",
      name: "Aleppo pepper",
      category: "Spices",
      unit: "g",
      count: 60,
      threshold: 20,
    },
    {
      roomId: "spice",
      name: "Smoked paprika",
      category: "Spices",
      unit: "g",
      count: 45,
      threshold: 20,
    },
    {
      roomId: "spice",
      name: "Black peppercorns",
      category: "Spices",
      unit: "g",
      count: 120,
      threshold: 30,
    },
    {
      roomId: "garage",
      name: "Bulk olive oil tin",
      category: "Oils & vinegars",
      unit: "L",
      count: 5,
      threshold: 1,
    },
    {
      roomId: "maya-pantry",
      name: "Plum jam, home-made",
      category: "Preserves",
      unit: "jars",
      count: 6,
      threshold: 2,
      shelf: "Top",
    },
    {
      roomId: "maya-pantry",
      name: "Sourdough crackers",
      category: "Baking",
      unit: "pkts",
      count: 2,
      threshold: 2,
    },
  ];

  type SeedItem = (typeof itemData)[number] & {
    brand?: string;
    barcode?: string;
    notes?: string;
    tags?: string;
    expiresAt?: Date;
    openedAt?: Date;
    purchasedAt?: Date;
    lastPrice?: number;
    reorderAmount?: number;
    photoUrl?: string;
  };
  const enriched = (itemData as SeedItem[]).map((d) => ({
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
    photoUrl: d.photoUrl ?? null,
    createdAt: today,
    updatedAt: today,
  }));

  for (const it of enriched) {
    await db.insert(items).values(it);
    await db.insert(itemEvents).values({
      id: randomUUID(),
      itemId: it.id,
      userId: alexId,
      kind: "created",
      countAfter: it.count,
      actor: "Alex",
      createdAt: today,
    });
  }

  const oliveOil = enriched.find((i) => i.name.includes("Frantoio"));
  if (oliveOil) {
    await db.insert(itemEvents).values([
      {
        id: randomUUID(),
        itemId: oliveOil.id,
        userId: null,
        kind: "low_threshold_crossed",
        countAfter: 0.4,
        actor: "auto",
        createdAt: day(-1),
      },
      {
        id: randomUUID(),
        itemId: oliveOil.id,
        userId: mayaId,
        kind: "consume",
        delta: -0.05,
        countAfter: 0.4,
        actor: "Maya",
        createdAt: day(-3),
      },
      {
        id: randomUUID(),
        itemId: oliveOil.id,
        userId: alexId,
        kind: "opened",
        countAfter: 1.0,
        actor: "Alex",
        createdAt: day(-10),
      },
      {
        id: randomUUID(),
        itemId: oliveOil.id,
        userId: alexId,
        kind: "restock",
        delta: 1.0,
        countAfter: 1.0,
        actor: "Alex",
        note: "Olive Tree Grocers",
        createdAt: day(-12),
      },
    ]);
  }
  const flour = enriched.find((i) => i.name.includes("00 pizza flour"));
  if (flour) {
    await db.insert(itemEvents).values([
      {
        id: randomUUID(),
        itemId: flour.id,
        userId: null,
        kind: "low_threshold_crossed",
        countAfter: 0.5,
        actor: "auto",
        createdAt: day(-2),
      },
      {
        id: randomUUID(),
        itemId: flour.id,
        userId: alexId,
        kind: "consume",
        delta: -0.5,
        countAfter: 0.5,
        actor: "Alex",
        createdAt: day(-2),
      },
    ]);
  }

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
  for (const it of enriched) {
    if (it.threshold && it.count < it.threshold) {
      const room = roomData.find((r) => r.id === it.roomId);
      await db.insert(shoppingItems).values({
        id: randomUUID(),
        userId: alexId,
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
  await db.insert(shoppingItems).values([
    {
      id: randomUUID(),
      userId: alexId,
      itemId: null,
      name: "Lemons",
      quantity: 4,
      unit: "ea",
      reason: "MANUAL · MAYA",
      groupName: "Produce",
      estPrice: 2.4,
      done: false,
      source: "manual",
    },
    {
      id: randomUUID(),
      userId: alexId,
      itemId: null,
      name: "Parchment paper",
      quantity: 1,
      unit: "box",
      reason: "MANUAL",
      groupName: "Other",
      estPrice: 6.5,
      done: true,
      source: "manual",
      createdAt: day(-2),
    },
    {
      id: randomUUID(),
      userId: alexId,
      itemId: null,
      name: "Whole-milk ricotta",
      quantity: 500,
      unit: "g",
      reason: "MANUAL · For lasagna Sunday",
      groupName: "Cold & dairy",
      estPrice: 5.0,
      done: true,
      source: "manual",
      createdAt: day(-2),
    },
  ]);

  await db.insert(shoppingTrips).values([
    { id: randomUUID(), userId: alexId, itemCount: 8, completedAt: day(-7) },
    { id: randomUUID(), userId: alexId, itemCount: 5, completedAt: day(-14) },
    { id: randomUUID(), userId: alexId, itemCount: 11, completedAt: day(-22) },
  ]);

  if (oliveOil) {
    await db.insert(notifications).values({
      id: randomUUID(),
      userId: alexId,
      kind: "low_threshold_crossed",
      title: `${oliveOil.name} dropped below the floor`,
      body: `Maya brought it to 0.4 (floor: 1) in Kitchen.`,
      link: `/items/${oliveOil.id}`,
      itemId: oliveOil.id,
      roomId: oliveOil.roomId,
      createdAt: day(-1),
    });
  }
  if (flour) {
    await db.insert(notifications).values({
      id: randomUUID(),
      userId: alexId,
      kind: "low_threshold_crossed",
      title: `${flour.name} dropped below the floor`,
      body: `Alex brought it to 0.5 (floor: 2) in Pantry.`,
      link: `/items/${flour.id}`,
      itemId: flour.id,
      roomId: flour.roomId,
      createdAt: day(-2),
    });
  }
  const yeast = enriched.find((i) => i.name === "Active dry yeast" && i.roomId === "fridge");
  if (yeast) {
    await db.insert(notifications).values({
      id: randomUUID(),
      userId: alexId,
      kind: "low_threshold_crossed",
      title: `${yeast.name} dropped below the floor`,
      body: `Alex brought it to 2 (floor: 4) in Fridge.`,
      link: `/items/${yeast.id}`,
      itemId: yeast.id,
      roomId: yeast.roomId,
      readAt: day(-3),
      createdAt: day(-5),
    });
  }
  if (flour) {
    await db.insert(notifications).values({
      id: randomUUID(),
      userId: mayaId,
      kind: "low_threshold_crossed",
      title: `${flour.name} dropped below the floor`,
      body: `Alex brought it to 0.5 (floor: 2) in Pantry.`,
      link: `/items/${flour.id}`,
      itemId: flour.id,
      roomId: flour.roomId,
      createdAt: day(-2),
    });
  }

  return {
    rooms: roomData.length,
    items: enriched.length,
    users: DEMO_USERS.length,
    pendingInviteToken: inviteToken,
  };
}
