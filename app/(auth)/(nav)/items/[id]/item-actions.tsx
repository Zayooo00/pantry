"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Modal } from "@/components/modal";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EditItemForm } from "@/components/edit-item-form";
import { MoveItemForm } from "@/components/move-item-form";
import { useToast } from "@/components/toast";
import { cn } from "@/lib/cn";
import { button } from "@/components/button";
import { invalidateApi, useMutation } from "@/lib/api/client";
import type { Item as ItemRow, Room as RoomRow } from "@/db/schema";

type Item = Omit<ItemRow, "count" | "createdAt" | "updatedAt">;

type RoomLite = Pick<RoomRow, "id" | "name">;

export function ItemActions({ item, rooms }: { item: Item; rooms: RoomLite[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [editOpen, setEditOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { trigger: triggerDelete } = useMutation("delete", "/api/items/{id}");

  async function deleteItem() {
    await triggerDelete({ params: { path: { id: item.id } } });
    await invalidateApi("/api/sidebar");
    toast(<>Removed <em>{item.name}</em>.</>);
    router.push(`/rooms/${item.roomId}`);
    router.refresh();
  }

  return (
    <>
      <div className="flex gap-2">
        <button type="button" onClick={() => setEditOpen(true)} className={button({ variant: "ghost", size: "sm" })}>
          Edit
        </button>
        <button type="button" onClick={() => setMoveOpen(true)} className={button({ variant: "ghost", size: "sm" })}>
          Move
        </button>
        <button
          type="button"
          onClick={() => setDeleteOpen(true)}
          className={cn(
            button({ variant: "ghost", size: "sm" }),
            "text-tomato-2 hover:border-tomato-2! hover:bg-tomato-3!",
          )}
        >
          Delete
        </button>
      </div>

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={
          <>
            Edit <em>{item.name}</em>
          </>
        }
        width={680}
      >
        <EditItemForm item={item} onClose={() => setEditOpen(false)} />
      </Modal>

      <Modal
        open={moveOpen}
        onClose={() => setMoveOpen(false)}
        title={
          <>
            Move <em>{item.name}</em>
          </>
        }
      >
        <MoveItemForm
          itemId={item.id}
          itemName={item.name}
          currentRoomId={item.roomId}
          rooms={rooms}
          onClose={() => setMoveOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={deleteItem}
        title="Remove item?"
        message={
          <>
            <em>{item.name}</em> will be removed from the pantry. This is permanent — its history
            goes too.
          </>
        }
        confirmLabel="Remove item"
        variant="danger"
      />
    </>
  );
}

export function MarkOpenedButton({
  itemId,
  itemName,
  alreadyOpened,
}: {
  itemId: string;
  itemName: string;
  alreadyOpened: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const { trigger, isMutating } = useMutation("post", "/api/items/{id}/open");

  async function mark() {
    await trigger({ params: { path: { id: itemId } } });
    toast(<>Marked <em>{itemName}</em> opened.</>);
    router.refresh();
  }

  return (
    <button type="button" onClick={mark} disabled={isMutating} className={button({ variant: "ghost", size: "sm" })}>
      {alreadyOpened ? "Re-mark opened" : "Mark opened"}
    </button>
  );
}
