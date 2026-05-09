import { NextResponse } from "next/server";
import { and, eq, isNull, sql } from "drizzle-orm";
import { db, notifications } from "@/db";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const rows = await db
    .select({ count: sql<number>`count(*)` })
    .from(notifications)
    .where(
      and(eq(notifications.userId, session.user.id), isNull(notifications.readAt)),
    );
  return NextResponse.json({ count: rows[0]?.count ?? 0 });
}
