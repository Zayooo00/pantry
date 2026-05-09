"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Select } from "./select";
import { useToast } from "./toast";
import { PhotoUpload } from "./photo-upload";
import { button } from "@/components/button";
import { chip } from "@/components/chip";
import { TextArea, TextInput } from "@/components/text-input";
import { invalidateApi, useMutation } from "@/lib/api/client";
import type { Item as ItemRow } from "@/db/schema";

const CATEGORIES = [
  "Grains",
  "Canned",
  "Oils & vinegars",
  "Spices",
  "Baking",
  "Preserves",
  "Drinks",
  "Dairy",
  "Produce",
  "Frozen",
];
const UNITS = [
  "Tin",
  "Jar",
  "Bottle",
  "btl",
  "L",
  "ml",
  "kg",
  "g",
  "ea",
  "pkts",
  "box",
  "bags",
  "tins",
  "jars",
  "sticks",
  "balls",
  "bunch",
];

const numericString = z.string().refine((s) => s === "" || !Number.isNaN(Number(s)), {
  message: "Enter a number.",
});

const EditItemSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  brand: z.string().trim(),
  category: z.string(),
  unit: z.string().min(1),
  shelf: z.string().trim(),
  threshold: numericString,
  reorderAmount: numericString,
  expiresAt: z.string(),
  openedAt: z.string(),
  purchasedAt: z.string(),
  lastPrice: numericString,
  barcode: z.string().trim(),
  notes: z.string().trim(),
  tags: z.array(z.string()),
  photoUrl: z.string().nullable(),
});

type EditItemValues = z.infer<typeof EditItemSchema>;

type ItemEditable = Omit<ItemRow, "roomId" | "count" | "createdAt" | "updatedAt">;

function dateInputValue(d: Date | null): string {
  if (!d) {
    return "";
  }
  return d.toISOString().slice(0, 10);
}

function nullableNumber(s: string): number | null {
  return s === "" ? null : Number(s);
}

function nullableDate(s: string): string | null {
  return s ? new Date(s).toISOString() : null;
}

export function EditItemForm({ item, onClose }: { item: ItemEditable; onClose: () => void }) {
  const router = useRouter();
  const { toast } = useToast();
  const [serverError, setServerError] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState("");

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EditItemValues>({
    resolver: zodResolver(EditItemSchema),
    defaultValues: {
      name: item.name,
      brand: item.brand ?? "",
      category: item.category ?? CATEGORIES[0],
      unit: item.unit,
      shelf: item.shelf ?? "",
      threshold: item.threshold?.toString() ?? "",
      reorderAmount: item.reorderAmount?.toString() ?? "",
      expiresAt: dateInputValue(item.expiresAt),
      openedAt: dateInputValue(item.openedAt),
      purchasedAt: dateInputValue(item.purchasedAt),
      lastPrice: item.lastPrice?.toString() ?? "",
      barcode: item.barcode ?? "",
      notes: item.notes ?? "",
      tags: (item.tags ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      photoUrl: item.photoUrl,
    },
  });

  const tags = watch("tags");

  function addTag() {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) {
      setValue("tags", [...tags, t], { shouldDirty: true });
    }
    setTagInput("");
  }

  function removeTag(tag: string) {
    setValue(
      "tags",
      tags.filter((x) => x !== tag),
      { shouldDirty: true },
    );
  }

  const { trigger } = useMutation("patch", "/api/items/{id}");

  async function onSubmit(values: EditItemValues) {
    setServerError(null);
    try {
      await trigger({
        params: { path: { id: item.id } },
        body: {
          name: values.name,
          brand: values.brand || null,
          category: values.category || null,
          unit: values.unit,
          threshold: nullableNumber(values.threshold) ?? undefined,
          reorderAmount: nullableNumber(values.reorderAmount) ?? undefined,
          shelf: values.shelf || null,
          expiresAt: nullableDate(values.expiresAt) ?? undefined,
          openedAt: nullableDate(values.openedAt) ?? undefined,
          purchasedAt: nullableDate(values.purchasedAt) ?? undefined,
          lastPrice: nullableNumber(values.lastPrice) ?? undefined,
          barcode: values.barcode || null,
          notes: values.notes || null,
          tags: values.tags.join(","),
          photoUrl: values.photoUrl,
        },
      });
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Could not save changes.");
      return;
    }
    await invalidateApi("/api/sidebar");
    toast(
      <>
        Saved <em>{values.name}</em>.
      </>,
    );
    onClose();
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="field-label">Item name</label>
          <TextInput {...register("name")} />
          {errors.name && (
            <div className="mt-1 font-display text-sm text-tomato-2">{errors.name.message}</div>
          )}
        </div>
        <div>
          <label className="field-label">Brand</label>
          <TextInput {...register("brand")} />
        </div>
        <div>
          <label className="field-label">Category</label>
          <Controller
            control={control}
            name="category"
            render={({ field }) => (
              <Select
                value={field.value}
                onChange={field.onChange}
                options={CATEGORIES.map((c) => ({ value: c, label: c }))}
              />
            )}
          />
        </div>
        <div>
          <label className="field-label">Unit</label>
          <Controller
            control={control}
            name="unit"
            render={({ field }) => (
              <Select
                value={field.value}
                onChange={field.onChange}
                options={UNITS.map((u) => ({ value: u, label: u }))}
              />
            )}
          />
        </div>
        <div>
          <label className="field-label">Shelf / bin</label>
          <TextInput placeholder="A-04" {...register("shelf")} />
        </div>
        <div>
          <label className="field-label">Low-stock floor</label>
          <TextInput type="number" step="0.1" min="0" {...register("threshold")} />
        </div>
        <div>
          <label className="field-label">Reorder amount</label>
          <TextInput type="number" step="0.1" min="0" {...register("reorderAmount")} />
        </div>
        <div>
          <label className="field-label">Expires</label>
          <TextInput type="date" {...register("expiresAt")} />
        </div>
        <div>
          <label className="field-label">Opened</label>
          <TextInput type="date" {...register("openedAt")} />
        </div>
        <div>
          <label className="field-label">Purchased</label>
          <TextInput type="date" {...register("purchasedAt")} />
        </div>
        <div>
          <label className="field-label">Last price</label>
          <TextInput
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            {...register("lastPrice")}
          />
        </div>
        <div className="col-span-2">
          <label className="field-label">Barcode</label>
          <TextInput {...register("barcode")} />
        </div>
        <div className="col-span-2">
          <label className="field-label">Tags</label>
          <div className="flex flex-wrap gap-2">
            {tags.map((t) => (
              <button
                key={t}
                type="button"
                className={chip({ active: true })}
                onClick={() => removeTag(t)}
              >
                {t} ✕
              </button>
            ))}
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag();
                }
              }}
              placeholder="+ Add tag"
              className="rounded-full border border-paper-4 bg-paper-0 px-3 py-1.5 text-xs outline-none focus:border-ink-2"
            />
          </div>
        </div>
        <div className="col-span-2">
          <label className="field-label">Photo</label>
          <Controller
            control={control}
            name="photoUrl"
            render={({ field }) => <PhotoUpload value={field.value} onChange={field.onChange} />}
          />
        </div>
        <div className="col-span-2">
          <label className="field-label">Notes</label>
          <TextArea rows={3} {...register("notes")} />
        </div>
      </div>
      {serverError && (
        <div className="rounded-md border border-tomato-2 bg-tomato-3 px-3 py-2 font-display text-sm text-tomato-2">
          {serverError}
        </div>
      )}
      <div className="flex justify-end gap-3 border-t border-paper-3 pt-2">
        <button type="button" onClick={onClose} className={button({ variant: "ghost" })}>
          Cancel
        </button>
        <button type="submit" disabled={isSubmitting} className={button({ variant: "primary" })}>
          {isSubmitting ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
