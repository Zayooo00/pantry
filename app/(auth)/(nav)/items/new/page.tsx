import { getRoomsWithCounts } from "@/lib/queries";
import { getRoomRolesForUser, requireUserId } from "@/lib/access";
import { AddItemForm } from "./add-item-form";

export const dynamic = "force-dynamic";

export default async function NewItemPage({
  searchParams,
}: {
  searchParams: Promise<{ room?: string; barcode?: string; prefillFromOff?: string }>;
}) {
  const userId = await requireUserId();
  const sp = await searchParams;
  const [allRooms, roles] = await Promise.all([
    getRoomsWithCounts(userId),
    getRoomRolesForUser(userId),
  ]);
  const editableRooms = allRooms.filter((r) => {
    const role = roles.get(r.id);
    return role === "owner" || role === "editor";
  });
  const initialBarcode = sp.barcode && /^\d{8,14}$/.test(sp.barcode) ? sp.barcode : "";
  return (
    <AddItemForm
      rooms={editableRooms}
      initialRoomId={sp.room ?? editableRooms[0]?.id ?? ""}
      initialBarcode={initialBarcode}
      prefillFromOff={sp.prefillFromOff === "1" && initialBarcode !== ""}
    />
  );
}
