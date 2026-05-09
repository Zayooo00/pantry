"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Modal } from "@/components/modal";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EditRoomForm } from "@/components/edit-room-form";
import { useToast } from "@/components/toast";
import { button } from "@/components/button";
import { roleBadge } from "@/components/role-badge";
import { cn } from "@/lib/cn";
import { invalidateApi, useMutation } from "@/lib/api/client";
import type { Room as RoomRow } from "@/db/schema";

type Room = Pick<RoomRow, "id" | "name" | "glyph" | "subtitle" | "tinted">;

type Role = "owner" | "editor" | "viewer";

const ROLE_LABEL: Record<Role, string> = {
  owner: "OWNER",
  editor: "SHARED · EDITOR",
  viewer: "SHARED · VIEWER",
};

export function RoomDetailHeader({
  room,
  idx,
  total,
  itemCount,
  role,
  archived,
}: {
  room: Room;
  idx: string;
  total: string;
  itemCount: number;
  role: Role;
  archived: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const canEdit = role === "owner" || role === "editor";
  const isOwner = role === "owner";
  const { trigger: triggerPatch } = useMutation("patch", "/api/rooms/{id}");
  const { trigger: triggerDelete } = useMutation("delete", "/api/rooms/{id}");

  async function toggleArchive() {
    const next = !archived;
    try {
      await triggerPatch({
        params: { path: { id: room.id } },
        body: { archived: next },
      });
    } catch (err) {
      toast(<>Couldn't update: {err instanceof Error ? err.message : "unknown error"}</>);
      return;
    }
    await invalidateApi("/api/sidebar");
    toast(
      next ? (
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

  async function deleteRoom() {
    try {
      await triggerDelete({ params: { path: { id: room.id } } });
    } catch (err) {
      toast(<>Couldn't delete: {err instanceof Error ? err.message : "unknown error"}</>);
      return;
    }
    await invalidateApi("/api/sidebar");
    toast(
      <>
        Removed <em>{room.name}</em>.
      </>,
    );
    router.push("/rooms");
    router.refresh();
  }

  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-6 md:mb-12">
        <div>
          <div className="caption flex flex-wrap items-center gap-3">
            <span>
              ROOM {idx} / {total}
              {room.subtitle ? ` · ${room.subtitle.toUpperCase()}` : ""}
            </span>
            <span className={roleBadge({ role })}>{ROLE_LABEL[role]}</span>
            {archived && (
              <span className="rounded-full border border-paper-3 bg-paper-1 px-2 py-0.5 font-mono text-3xs tracking-eyebrow-loose text-ink-3 uppercase">
                ARCHIVED
              </span>
            )}
          </div>
          <h1 className="m-0 mt-2 font-display text-3xl leading-none font-light tracking-display sm:text-4xl lg:text-6xl">
            The <em className="font-normal italic">{room.name.toLowerCase()}</em>.
          </h1>
          <div className="mt-3 font-display text-md font-light text-ink-3 italic sm:text-xl">
            {itemCount} item{itemCount === 1 ? "" : "s"}.
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          {canEdit && (
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className={button({ variant: "ghost" })}
            >
              Edit room
            </button>
          )}
          {isOwner && (
            <button type="button" onClick={toggleArchive} className={button({ variant: "ghost" })}>
              {archived ? "Restore room" : "Archive room"}
            </button>
          )}
          {isOwner && (
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              className={cn(
                button({ variant: "ghost" }),
                "text-tomato-2 hover:border-tomato-2! hover:bg-tomato-3!",
              )}
            >
              Delete room
            </button>
          )}
          {canEdit && !archived && (
            <Link href={`/items/new?room=${room.id}`} className={button({ variant: "primary" })}>
              ＋ Add to {room.name.toLowerCase()}
            </Link>
          )}
        </div>
      </div>

      {archived && (
        <div className="mb-8 rounded-md border border-paper-3 bg-paper-1 px-4 py-3 font-display text-sm text-ink-3 italic">
          This room is archived — hidden from the sidebar, dashboard and search. Restore to use it
          again.
        </div>
      )}

      {canEdit && (
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
      )}

      {isOwner && (
        <ConfirmDialog
          open={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          onConfirm={deleteRoom}
          title="Remove this room?"
          message={
            itemCount > 0 ? (
              <>
                <em>{room.name}</em> still holds{" "}
                <strong>
                  {itemCount} item{itemCount === 1 ? "" : "s"}
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
      )}
    </>
  );
}
