import { NextRequest, NextResponse } from "next/server";
import { db, shoppingItems } from "@/db";
import { randomUUID } from "node:crypto";
import { addToShoppingList } from "@/lib/queries";
import { ForbiddenError } from "@/lib/access";
import { auth } from "@/auth";
import { FromItemShoppingRequest, ManualShoppingRequest } from "@/lib/api/schemas";
import { readJsonOr400 } from "@/lib/json";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const userId = session.user.id;
  const body = await readJsonOr400(req);
  if (body instanceof NextResponse) {
    return body;
  }
  const fromItem = FromItemShoppingRequest.safeParse(body);
  if (fromItem.success) {
    try {
      const row = await addToShoppingList(fromItem.data.itemId, userId);
      return NextResponse.json(row);
    } catch (err) {
      if (err instanceof ForbiddenError) {
        return NextResponse.json({ error: err.message }, { status: 403 });
      }
      const message = err instanceof Error ? err.message : "Could not add to list.";
      return NextResponse.json({ error: message }, { status: 404 });
    }
  }
  const manual = ManualShoppingRequest.safeParse(body);
  if (!manual.success) {
    return NextResponse.json({ error: manual.error.flatten() }, { status: 400 });
  }
  const id = randomUUID();
  await db.insert(shoppingItems).values({
    id,
    userId,
    name: manual.data.name,
    quantity: manual.data.quantity,
    unit: manual.data.unit,
    groupName: manual.data.groupName ?? "Other",
    reason: manual.data.reason ?? "MANUAL",
    source: "manual",
    done: false,
  });
  return NextResponse.json({ id });
}
