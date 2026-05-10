import { getRoomsWithCounts } from "@/lib/queries";
import { getRoomRolesForUser, requireUserId } from "@/lib/access";
import { RoomsPageClient } from "./rooms-page-client";

export const dynamic = "force-dynamic";

export default async function RoomsPage() {
  const userId = await requireUserId();
  const allRooms = await getRoomsWithCounts(userId, { includeArchived: true });
  const roles = await getRoomRolesForUser(userId);
  const enriched = allRooms.map((r) => ({
    ...r,
    role: roles.get(r.id) ?? "viewer",
    archived: r.archivedAt !== null,
  }));
  return <RoomsPageClient initialRooms={enriched} />;
}
