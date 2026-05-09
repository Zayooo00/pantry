"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Modal } from "@/components/modal";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EditRoomForm } from "@/components/edit-room-form";
import { useToast } from "@/components/toast";
import { cn } from "@/lib/cn";
import { invalidateApi, useMutation } from "@/lib/api/client";
import type { Room as RoomRow } from "@/db/schema";

type Room = Pick<RoomRow, "id" | "name" | "glyph" | "subtitle" | "tinted"> & {
  itemCount: number;
  archived: boolean;
};

export function RoomRowActions({ room }: { room: Room }) {
  const router = useRouter();
  const { toast } = useToast();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { trigger } = useMutation("delete", "/api/rooms/{id}");
  const { trigger: triggerPatch } = useMutation("patch", "/api/rooms/{id}");

  async function deleteRoom() {
    try {
      await trigger({ params: { path: { id: room.id } } });
    } catch (err) {
      const message = err instanceof Error ? err.message : "unknown error";
      toast(<>Couldn't delete: {message}</>);
      return;
    }
    await invalidateApi("/api/sidebar");
    toast(
      <>
        Removed <em>{room.name}</em>.
      </>,
    );
    router.refresh();
  }

  async function toggleArchive() {
    const archive = !room.archived;
    try {
      await triggerPatch({
        params: { path: { id: room.id } },
        body: { archived: archive },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "unknown error";
      toast(<>Couldn't update: {message}</>);
      return;
    }
    await invalidateApi("/api/sidebar");
    toast(
      archive ? (
        <>
          Archived <em>{room.name}</em>.
        </>
      ) : (
        <>
          Restored <em>{room.name}</em>.
        </>
      ),
    );
    router.refresh();
  }

  return (
    <>
      <div className="relative z-10 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          onClick={() => setEditOpen(true)}
          className="grid h-8 w-8 cursor-pointer place-items-center rounded-full border border-transparent bg-transparent text-ink-2 transition-all duration-150 ease-pantry hover:border-paper-3 hover:bg-paper-2 hover:text-ink-0 active:scale-95"
          title="Edit room"
          aria-label="Edit room"
        >
          ✎
        </button>
        <button
          type="button"
          onClick={toggleArchive}
          className="grid h-8 w-8 cursor-pointer place-items-center rounded-full border border-transparent bg-transparent text-ink-2 transition-all duration-150 ease-pantry hover:border-paper-3 hover:bg-paper-2 hover:text-ink-0 active:scale-95"
          title={room.archived ? "Restore room" : "Archive room"}
          aria-label={room.archived ? "Restore room" : "Archive room"}
        >
          {room.archived ? "↺" : "▣"}
        </button>
        <button
          type="button"
          onClick={() => setDeleteOpen(true)}
          className={cn(
            "grid h-8 w-8 cursor-pointer place-items-center rounded-full border border-transparent bg-transparent text-ink-2 transition-all duration-150 ease-pantry hover:border-paper-3 hover:bg-paper-2 hover:text-ink-0 active:scale-95",
            "text-tomato-2 hover:border-tomato-2! hover:bg-tomato-3!",
          )}
          title="Delete room"
          aria-label="Delete room"
        >
          ✕
        </button>
      </div>

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={
          <>
            Edit <em>{room.name}</em>
          </>
        }
      >
        <EditRoomForm room={room} onClose={() => setEditOpen(false)} />
      </Modal>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={deleteRoom}
        title="Remove this room?"
        message={
          room.itemCount > 0 ? (
            <>
              <em>{room.name}</em> still holds{" "}
              <strong>
                {room.itemCount} item{room.itemCount === 1 ? "" : "s"}
              </strong>
              . Move them first — the room can't be removed while it's not empty.
            </>
          ) : (
            <>
              <em>{room.name}</em> will be removed. This is permanent.
            </>
          )
        }
        confirmLabel="Remove room"
        variant="danger"
      />
    </>
  );
}
