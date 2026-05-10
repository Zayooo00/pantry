import { desc, eq } from "drizzle-orm";
import { db, notifications } from "@/db";
import { requireUserId } from "@/lib/access";
import { NotificationsClient } from "./notifications-client";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const userId = await requireUserId();
  const rows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(100);
  return (
    <NotificationsClient
      initial={rows.map((n) => ({
        ...n,
        createdAt: n.createdAt.toISOString(),
        readAt: n.readAt ? n.readAt.toISOString() : null,
      }))}
    />
  );
}
