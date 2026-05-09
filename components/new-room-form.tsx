"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Checkbox } from "./checkbox";
import { ROOM_GLYPHS, RoomGlyph } from "@/icons";
import { useToast } from "./toast";
import { cn } from "@/lib/cn";
import { button } from "@/components/button";
import { TextInput } from "@/components/text-input";
import { invalidateApi, useMutation } from "@/lib/api/client";

const NewRoomSchema = z.object({
  name: z.string().trim().min(1, "Name your room first."),
  glyph: z.string().min(1),
  subtitle: z.string().trim(),
  tinted: z.boolean(),
});

type NewRoomValues = z.infer<typeof NewRoomSchema>;

export function NewRoomForm({ onClose }: { onClose: () => void }) {
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
  } = useForm<NewRoomValues>({
    resolver: zodResolver(NewRoomSchema),
    defaultValues: { name: "", glyph: "pantry", subtitle: "", tinted: false },
  });

  const glyph = watch("glyph");
  const { trigger } = useMutation("post", "/api/rooms");

  async function onSubmit(values: NewRoomValues) {
    setServerError(null);
    try {
      await trigger({
        body: {
          name: values.name,
          glyph: values.glyph,
          subtitle: values.subtitle || null,
          tinted: values.tinted,
        },
      });
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Could not create room.");
      return;
    }
    await invalidateApi("/api/sidebar");
    toast(
      <>
        Room <em>{values.name}</em> opened.
      </>,
    );
    onClose();
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <div>
        <label className="field-label">Room name</label>
        <TextInput autoFocus placeholder="e.g. Wine cellar" {...register("name")} />
        {errors.name && (
          <div className="mt-1 font-display text-sm text-tomato-2">{errors.name.message}</div>
        )}
      </div>
      <div>
        <label className="field-label">Glyph</label>
        <div className="flex flex-wrap gap-2">
          {ROOM_GLYPHS.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setValue("glyph", g, { shouldDirty: true })}
              className={cn(
                "grid h-12 w-12 place-items-center rounded-md border transition-all hover:border-ink-2",
                glyph === g
                  ? "border-ink-1 bg-ink-1 text-paper-0"
                  : "border-paper-3 bg-paper-0 text-ink-2",
              )}
              title={g}
            >
              <RoomGlyph name={g} size={20} />
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="field-label">Subtitle (optional)</label>
        <TextInput placeholder="A short description — what lives here." {...register("subtitle")} />
      </div>
      <Controller
        control={control}
        name="tinted"
        render={({ field }) => (
          <label className="flex cursor-pointer items-center gap-3">
            <Checkbox checked={field.value} onChange={field.onChange} />
            <span className="text-sm">Tint this room (uses the olive accent)</span>
          </label>
        )}
      />
      {serverError && (
        <div className="rounded-md border border-tomato-2 bg-tomato-3 px-3 py-2 font-display text-sm text-tomato-2">
          {serverError}
        </div>
      )}
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className={button({ variant: "ghost" })}>
          Cancel
        </button>
        <button type="submit" disabled={isSubmitting} className={button({ variant: "primary" })}>
          {isSubmitting ? "Creating…" : "Create room"}
        </button>
      </div>
    </form>
  );
}
