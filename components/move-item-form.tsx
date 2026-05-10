"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Select } from "./select";
import { useToast } from "./toast";
import { button } from "@/components/button";
import { invalidateApi, useMutation } from "@/lib/api/client";
import type { Room as RoomRow } from "@/db/schema";

const MoveItemSchema = z.object({
  roomId: z.string().min(1),
  shelf: z.string().trim(),
});

type MoveItemValues = z.infer<typeof MoveItemSchema>;

type RoomLite = Pick<RoomRow, "id" | "name">;

export function MoveItemForm({
  itemId,
  itemName,
  currentRoomId,
  rooms,
  onClose,
}: {
  itemId: string;
  itemName: string;
  currentRoomId: string;
  rooms: RoomLite[];
  onClose: () => void;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { isSubmitting },
  } = useForm<MoveItemValues>({
    resolver: zodResolver(MoveItemSchema),
    defaultValues: { roomId: currentRoomId, shelf: "" },
  });

  const roomId = watch("roomId");
  const shelf = watch("shelf");
  const noChange = roomId === currentRoomId && !shelf.trim();
  const { trigger } = useMutation("patch", "/api/items/{id}");

  async function onSubmit(values: MoveItemValues) {
    if (values.roomId === currentRoomId && !values.shelf.trim()) {
      onClose();
      return;
    }
    setServerError(null);
    try {
      await trigger({
        params: { path: { id: itemId } },
        body: {
          roomId: values.roomId,
          ...(values.shelf.trim() ? { shelf: values.shelf } : {}),
        },
      });
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Could not move the item.");
      return;
    }
    const target = rooms.find((r) => r.id === values.roomId);
    toast(
      <>
        Moved <em>{itemName}</em> to {target?.name ?? "another room"}.
      </>,
    );
    onClose();
    router.refresh();
    void invalidateApi("/api/sidebar");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <div>
        <label className="mb-2 block font-mono text-xs tracking-label text-ink-3 uppercase">
          New room
        </label>
        <Controller
          control={control}
          name="roomId"
          render={({ field }) => (
            <Select
              value={field.value}
              onChange={field.onChange}
              options={rooms.map((r) => ({ value: r.id, label: r.name }))}
            />
          )}
        />
      </div>
      <div>
        <label className="mb-2 block font-mono text-xs tracking-label text-ink-3 uppercase">
          New shelf / bin (optional)
        </label>
        <input
          className="w-full rounded-md border border-paper-4 bg-paper-0 px-3.5 py-3 font-sans text-base text-ink-1 transition-[border-color] duration-150 ease-pantry placeholder:text-ink-4 focus:border-ink-1 focus:outline-none"
          placeholder="Leave blank to keep current"
          {...register("shelf")}
        />
      </div>
      {serverError && (
        <div className="rounded-md border border-tomato-2 bg-tomato-3 px-3 py-2 font-display text-sm text-tomato-2">
          {serverError}
        </div>
      )}
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className={button({ variant: "ghost" })}>
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || noChange}
          className={button({ variant: "primary" })}
        >
          {isSubmitting ? "Moving…" : "Move item"}
        </button>
      </div>
    </form>
  );
}
