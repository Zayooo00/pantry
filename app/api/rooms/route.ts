import { NextRequest, NextResponse } from "next/server";
import { db, rooms } from "@/db";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { auth } from "@/auth";
import { appendRoomPosition } from "@/lib/access";
import { CreateRoomRequest } from "@/lib/api/schemas";
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
  const parsed = CreateRoomRequest.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const owned = await db.select({ id: rooms.id }).from(rooms).where(eq(rooms.ownerId, userId));
  const id = randomUUID();
  await db.insert(rooms).values({
    id,
    ownerId: userId,
    name: parsed.data.name,
    glyph: parsed.data.glyph,
    subtitle: parsed.data.subtitle ?? null,
    tinted: parsed.data.tinted ?? false,
    position: owned.length,
  });
  await appendRoomPosition(userId, id);
  return NextResponse.json({ id });
}
