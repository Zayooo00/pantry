import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db, notifications } from "@/db";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const url = new URL(req.url);
  const onlyUnread = url.searchParams.get("unread") === "1";
  const limit = Math.min(200, Math.max(1, Number(url.searchParams.get("limit")) || 50));
  const condition = onlyUnread
    ? and(eq(notifications.userId, session.user.id), isNull(notifications.readAt))
    : eq(notifications.userId, session.user.id);
  const rows = await db
    .select()
    .from(notifications)
    .where(condition)
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
  return NextResponse.json({ notifications: rows });
}
