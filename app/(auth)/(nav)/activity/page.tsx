import { AppShell } from "@/components/app-shell";
import { requireUserId } from "@/lib/access";
import { getRecentEvents, getRoomsWithCounts } from "@/lib/queries";
import { ActivityClient } from "./activity-client";

export const dynamic = "force-dynamic";

export default async function ActivityPage() {
  const userId = await requireUserId();
  const [events, rooms] = await Promise.all([
    getRecentEvents(userId, { limit: 100 }),
    getRoomsWithCounts(userId),
  ]);
  return (
    <AppShell>
      <ActivityClient
        rooms={rooms.map((r) => ({ id: r.id, name: r.name }))}
        initialEvents={events.map((e) => ({
          ...e,
          createdAt: e.createdAt.toISOString(),
        }))}
      />
    </AppShell>
  );
}
