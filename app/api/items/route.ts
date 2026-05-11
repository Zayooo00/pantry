import { NextRequest, NextResponse } from "next/server";
import { db, items, itemEvents } from "@/db";
import { randomUUID } from "node:crypto";
import { auth } from "@/auth";
import { canAttachPhotoUrl, canEditRoom } from "@/lib/access";
import { CreateItemRequest } from "@/lib/api/schemas";
import { readJsonOr400 } from "@/lib/json";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const body = await readJsonOr400(req);
  if (body instanceof NextResponse) {
    return body;
  }
  const parsed = CreateItemRequest.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  if (!(await canEditRoom(session.user.id, parsed.data.roomId))) {
    return NextResponse.json({ error: "You can't add items to that room." }, { status: 403 });
  }
  if (parsed.data.photoUrl && !canAttachPhotoUrl(parsed.data.photoUrl, session.user.id)) {
    return NextResponse.json(
      { error: "You can only attach photos you uploaded." },
      { status: 403 },
    );
  }
  const id = randomUUID();
  await db.insert(items).values({
    id,
    ...parsed.data,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  await db.insert(itemEvents).values({
    id: randomUUID(),
    itemId: id,
    userId: session.user.id,
    kind: "created",
    countAfter: parsed.data.count,
    actor: session.user.name ?? null,
  });
  return NextResponse.json({ id });
}
