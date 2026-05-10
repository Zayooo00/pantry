import { requireUserId } from "@/lib/access";
import { getNextTripNumber, getShoppingItems } from "@/lib/queries";
import { ShoppingList } from "./shopping-list";

export const dynamic = "force-dynamic";

export default async function ShoppingPage() {
  const userId = await requireUserId();
  const [items, tripNumber] = await Promise.all([
    getShoppingItems(userId),
    getNextTripNumber(userId),
  ]);
  return (
    <ShoppingList
      tripNumber={tripNumber}
      initialItems={items.map((i) => ({
        id: i.id,
        name: i.name,
        quantity: i.quantity,
        unit: i.unit,
        reason: i.reason,
        groupName: i.groupName ?? "Other",
        estPrice: i.estPrice,
        done: i.done,
        source: i.source,
      }))}
    />
  );
}
