import { NextRequest, NextResponse } from "next/server";
import { db, shoppingItems } from "@/db";
import { and, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { PatchShoppingRequest } from "@/lib/api/schemas";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const { id } = await params;
  const parsed = PatchShoppingRequest.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const result = await db
    .update(shoppingItems)
    .set(parsed.data)
    .where(and(eq(shoppingItems.id, id), eq(shoppingItems.userId, session.user.id)))
    .returning({ id: shoppingItems.id });
  if (result.length === 0) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const { id } = await params;
  const result = await db
    .delete(shoppingItems)
    .where(and(eq(shoppingItems.id, id), eq(shoppingItems.userId, session.user.id)))
    .returning({ id: shoppingItems.id });
  if (result.length === 0) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
