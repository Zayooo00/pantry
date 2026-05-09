import { NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { db, notifications } from "@/db";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.userId, session.user.id), isNull(notifications.readAt)));
  return NextResponse.json({ ok: true });
}
