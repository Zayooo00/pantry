"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { mutate as globalMutate } from "swr";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Checkbox } from "./checkbox";
import { ROOM_GLYPHS, RoomGlyph } from "@/icons";
import { useToast } from "./toast";
import { cn } from "@/lib/cn";
import { button } from "@/components/button";
import { TextInput } from "@/components/text-input";
import { useMutation } from "@/lib/api/client";
import type { Room as RoomRow } from "@/db/schema";

const EditRoomSchema = z.object({
  name: z.string().trim().min(1, "Name can't be empty."),
  glyph: z.string().min(1),
  subtitle: z.string().trim(),
  tinted: z.boolean(),
});

type EditRoomValues = z.infer<typeof EditRoomSchema>;

type Room = Pick<RoomRow, "id" | "name" | "glyph" | "subtitle" | "tinted">;

export function EditRoomForm({ room, onClose }: { room: Room; onClose: () => void }) {
  const router = useRouter();
  const { toast } = useToast();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EditRoomValues>({
    resolver: zodResolver(EditRoomSchema),
    defaultValues: {
      name: room.name,
      glyph: room.glyph,
      subtitle: room.subtitle ?? "",
      tinted: room.tinted,
    },
  });

  const glyph = watch("glyph");
  const { trigger } = useMutation("patch", "/api/rooms/{id}");

  async function onSubmit(values: EditRoomValues) {
    setServerError(null);
    try {
      await trigger({
        params: { path: { id: room.id } },
        body: {
          name: values.name,
          glyph: values.glyph,
          subtitle: values.subtitle || null,
          tinted: values.tinted,
        },
      });
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Could not save changes.");
      return;
    }
    globalMutate(["pantry", "/api/sidebar"]);
    toast(<>Updated <em>{values.name}</em>.</>);
    onClose();
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <div>
        <label className="field-label">Room name</label>
        <TextInput {...register("name")} />
        {errors.name && (
          <div className="text-tomato-2 text-sm font-display mt-1">{errors.name.message}</div>
        )}
      </div>
      <div>
        <label className="field-label">Glyph</label>
        <div className="flex gap-2 flex-wrap">
          {ROOM_GLYPHS.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setValue("glyph", g, { shouldDirty: true })}
              className={cn(
                "w-12 h-12 rounded-md border grid place-items-center transition-all hover:border-ink-2",
                glyph === g ? "border-ink-1 bg-ink-1 text-paper-0" : "border-paper-3 bg-paper-0 text-ink-2",
              )}
              title={g}
            >
              <RoomGlyph name={g} size={20} />
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="field-label">Subtitle</label>
        <TextInput {...register("subtitle")} />
      </div>
      <Controller
        control={control}
        name="tinted"
        render={({ field }) => (
          <label className="flex items-center gap-3 cursor-pointer">
            <Checkbox checked={field.value} onChange={field.onChange} />
            <span className="text-sm">Tint this room</span>
          </label>
        )}
      />
      {serverError && (
        <div className="bg-tomato-3 border border-tomato-2 text-tomato-2 rounded-md px-3 py-2 text-sm font-display">
          {serverError}
        </div>
      )}
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className={button({ variant: "ghost" })}>Cancel</button>
        <button type="submit" disabled={isSubmitting} className={button({ variant: "primary" })}>
          {isSubmitting ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
