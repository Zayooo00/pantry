import { AppShell } from "@/components/app-shell";
import { getRoomsWithCounts } from "@/lib/queries";
import { getRoomRolesForUser, requireUserId } from "@/lib/access";
import { AddItemForm } from "./add-item-form";

export const dynamic = "force-dynamic";

export default async function NewItemPage({
  searchParams,
}: {
  searchParams: Promise<{ room?: string }>;
}) {
  const userId = await requireUserId();
  const sp = await searchParams;
  const allRooms = await getRoomsWithCounts(userId);
  const roles = await getRoomRolesForUser(userId);
  const editableRooms = allRooms.filter((r) => {
    const role = roles.get(r.id);
    return role === "owner" || role === "editor";
  });
  return (
    <AppShell>
      <AddItemForm rooms={editableRooms} initialRoomId={sp.room ?? editableRooms[0]?.id ?? ""} />
    </AppShell>
  );
}
