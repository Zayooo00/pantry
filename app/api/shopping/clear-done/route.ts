import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { db, shoppingItems, shoppingTrips } from "@/db";
import { and, eq } from "drizzle-orm";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const userId = session.user.id;

  const cleared = await db
    .delete(shoppingItems)
    .where(and(eq(shoppingItems.userId, userId), eq(shoppingItems.done, true)))
    .returning({ id: shoppingItems.id });

  if (cleared.length > 0) {
    await db.insert(shoppingTrips).values({
      id: randomUUID(),
      userId,
      itemCount: cleared.length,
    });
  }

  return NextResponse.json({ ok: true, cleared: cleared.length });
}
