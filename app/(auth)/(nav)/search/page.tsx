import { AppShell } from "@/components/app-shell";
import { requireUserId } from "@/lib/access";
import { getRoomsWithCounts, getAllItems } from "@/lib/queries";
import { SearchClient } from "./search-client";
import { itemStatus } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const userId = await requireUserId();
  const sp = await searchParams;
  const rooms = await getRoomsWithCounts(userId);
  const items = await getAllItems(userId);

  return (
    <AppShell topbarPlaceholder="Search by name, brand, barcode, room…">
      <SearchClient
        initialQuery={sp.q ?? ""}
        initialStatus={sp.status === "low" || sp.status === "soon" ? sp.status : "all"}
        rooms={rooms.map((r) => ({ id: r.id, name: r.name }))}
        items={items.map((i) => ({
          id: i.id,
          name: i.name,
          brand: i.brand,
          barcode: i.barcode,
          roomId: i.roomId,
          category: i.category,
          shelf: i.shelf,
          count: i.count,
          unit: i.unit,
          threshold: i.threshold,
          photoUrl: i.photoUrl,
          status: itemStatus({ count: i.count, threshold: i.threshold, expiresAt: i.expiresAt }),
        }))}
      />
    </AppShell>
  );
}
