"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Select } from "@/components/select";
import { useToast } from "@/components/toast";
import { PhotoUpload } from "@/components/photo-upload";
import { cn } from "@/lib/cn";
import { badge } from "@/components/badge";
import { button } from "@/components/button";
import { chip } from "@/components/chip";
import { TextArea, TextInput } from "@/components/text-input";
import { invalidateApi, useMutation } from "@/lib/api/client";
import { formatCount } from "@/lib/format";
import type { Room as RoomRow } from "@/db/schema";

const PH =
  "relative bg-[repeating-linear-gradient(45deg,var(--color-paper-2)_0_6px,var(--color-paper-1)_6px_12px)] border border-paper-3 rounded-md grid place-items-center text-ink-4 font-mono text-2xs tracking-widest uppercase overflow-hidden";

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
const UNITS = ["Tin", "Jar", "Bottle", "L", "ml", "kg", "g", "ea", "pkts", "box"];

const numericString = z.string().refine((s) => s === "" || !Number.isNaN(Number(s)), {
  message: "Enter a number.",
});

const AddItemSchema = z.object({
  name: z.string().trim().min(1, "Name your item first."),
  brand: z.string().trim(),
  category: z.string(),
  unit: z.string().min(1),
  count: z.coerce.number().min(0, "Count must be 0 or more."),
  threshold: numericString,
  reorderAmount: numericString,
  roomId: z.string().min(1),
  shelf: z.string().trim(),
  expiresAt: z.string(),
  openedAt: z.string(),
  purchasedAt: z.string(),
  lastPrice: numericString,
  barcode: z.string().trim(),
  notes: z.string().trim(),
  tags: z.array(z.string().trim().min(1)),
  photoUrl: z.string().nullable(),
});

type AddItemValues = z.infer<typeof AddItemSchema>;

type RoomLite = Pick<RoomRow, "id" | "name">;

function nullableNumber(s: string): number | null {
  return s === "" ? null : Number(s);
}

function nullableDate(s: string): string | null {
  return s ? new Date(s).toISOString() : null;
}

export function AddItemForm({
  rooms,
  initialRoomId,
}: {
  rooms: RoomLite[];
  initialRoomId: string;
}) {
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
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddItemValues>({
    resolver: zodResolver(AddItemSchema),
    defaultValues: {
      name: "",
      brand: "",
      category: CATEGORIES[0],
      unit: UNITS[3],
      count: 1,
      threshold: "",
      reorderAmount: "",
      roomId: initialRoomId,
      shelf: "",
      expiresAt: "",
      openedAt: "",
      purchasedAt: "",
      lastPrice: "",
      barcode: "",
      notes: "",
      tags: [],
      photoUrl: null,
    },
  });

  const values = watch();
  const { trigger: triggerCreate } = useMutation("post", "/api/items");

  function addTag() {
    const t = tagInput.trim();
    if (t && !values.tags.includes(t)) {
      setValue("tags", [...values.tags, t], { shouldDirty: true });
    }
    setTagInput("");
  }

  function removeTag(tag: string) {
    setValue(
      "tags",
      values.tags.filter((x) => x !== tag),
      { shouldDirty: true },
    );
  }

  async function save(formValues: AddItemValues, addAnother: boolean) {
    setServerError(null);
    let json: { id: string } | undefined;
    try {
      json = (await triggerCreate({
        body: {
          name: formValues.name,
          brand: formValues.brand || null,
          category: formValues.category || null,
          unit: formValues.unit,
          count: formValues.count,
          threshold: nullableNumber(formValues.threshold) ?? undefined,
          reorderAmount: nullableNumber(formValues.reorderAmount) ?? undefined,
          roomId: formValues.roomId,
          shelf: formValues.shelf || null,
          expiresAt: nullableDate(formValues.expiresAt) ?? undefined,
          openedAt: nullableDate(formValues.openedAt) ?? undefined,
          purchasedAt: nullableDate(formValues.purchasedAt) ?? undefined,
          lastPrice: nullableNumber(formValues.lastPrice) ?? undefined,
          barcode: formValues.barcode || null,
          notes: formValues.notes || null,
          tags: formValues.tags.join(","),
          photoUrl: formValues.photoUrl,
        },
      })) as { id: string };
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : "Could not save item. Check the form and try again.",
      );
      return;
    }
    if (!json) {
      setServerError("Could not save item.");
      return;
    }
    await invalidateApi("/api/sidebar");
    toast(
      <>
        Added <em>{formValues.name}</em> to the ledger.
      </>,
    );
    if (addAnother) {
      reset({
        ...formValues,
        name: "",
        brand: "",
        count: 1,
        notes: "",
        barcode: "",
      });
    } else {
      router.push(`/items/${json.id}`);
    }
  }

  const onSubmitAndStay = handleSubmit((v) => save(v, true));
  const onSubmitAndGo = handleSubmit((v) => save(v, false));

  const thresholdNum = values.threshold === "" ? null : Number(values.threshold);
  const isLow = thresholdNum !== null && thresholdNum > Number(values.count);

  return (
    <form onSubmit={onSubmitAndGo} noValidate>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-6 md:mb-12">
        <div>
          <div className="caption">NEW ITEM</div>
          <h1 className="m-0 mt-2 font-display text-3xl leading-none font-light tracking-display sm:text-4xl lg:text-6xl">
            Add to <em className="font-normal italic">the ledger</em>.
          </h1>
          <div className="mt-3 font-display text-md font-light text-ink-3 italic sm:text-xl">
            A jar, a bag, a bottle. Tell the pantry.
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className={button({ variant: "ghost" })}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmitAndStay}
            disabled={isSubmitting}
            className={button({ variant: "secondary" })}
          >
            Save &amp; add another
          </button>
          <button type="submit" disabled={isSubmitting} className={button({ variant: "primary" })}>
            {isSubmitting ? "Saving…" : "Save item"}
          </button>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 items-center gap-3 rounded-xl bg-ink-1 p-5 text-paper-0 md:grid-cols-[1fr_auto] md:p-6">
        <div>
          <div className="font-display text-lg">
            Have a barcode? <em className="italic">Type it in.</em>
          </div>
          <div className="mt-1 font-mono text-2xs tracking-[0.14em] text-paper-3 uppercase">
            Stored alongside the item — searchable from anywhere.
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById("barcode-field");
              if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "center" });
                (el as HTMLInputElement).focus();
              }
            }}
            className={button({ variant: "olive" })}
          >
            ▣ Type barcode
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 md:gap-12 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-8 rounded-xl border border-paper-3 bg-paper-0 p-5 md:p-8">
          <Section num="01" title="Identity" required>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="field-label">Item name</label>
                <TextInput placeholder="Maldon sea salt" autoFocus {...register("name")} />
                {errors.name && (
                  <div className="mt-1 font-display text-sm text-tomato-2">
                    {errors.name.message}
                  </div>
                )}
              </div>
              <div>
                <label className="field-label">Brand</label>
                <TextInput placeholder="Optional" {...register("brand")} />
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
              <div className="md:col-span-2">
                <label className="field-label">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {values.tags.map((t) => (
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
            </div>
          </Section>

          <Section num="02" title="Quantity" required>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="field-label">Count on hand</label>
                <TextInput
                  type="number"
                  step="0.1"
                  min="0"
                  {...register("count", { valueAsNumber: true })}
                />
                {errors.count && (
                  <div className="mt-1 font-display text-sm text-tomato-2">
                    {errors.count.message}
                  </div>
                )}
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
                <label className="field-label">Low-stock floor</label>
                <TextInput
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="Optional"
                  {...register("threshold")}
                />
                <div className={cn("caption", "mt-1.5")}>
                  YOU'LL BE NOTIFIED WHEN COUNT FALLS BELOW.
                </div>
              </div>
              <div>
                <label className="field-label">Reorder amount</label>
                <TextInput
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="Optional"
                  {...register("reorderAmount")}
                />
                <div className={cn("caption", "mt-1.5")}>QUANTITY ADDED TO SHOPPING LIST.</div>
              </div>
            </div>
          </Section>

          <Section num="03" title="Where it lives" required>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="field-label">Room</label>
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
                <label className="field-label">Shelf / bin (optional)</label>
                <TextInput placeholder="e.g. A-04" {...register("shelf")} />
              </div>
            </div>
          </Section>

          <Section num="04" title="Dates" required={false}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
              <div className="md:col-span-2">
                <label className="field-label">Barcode</label>
                <TextInput
                  id="barcode-field"
                  className="font-mono"
                  placeholder="e.g. 8 014203 778124"
                  {...register("barcode")}
                />
              </div>
            </div>
          </Section>

          <Section num="05" title="Photo" required={false}>
            <Controller
              control={control}
              name="photoUrl"
              render={({ field }) => <PhotoUpload value={field.value} onChange={field.onChange} />}
            />
          </Section>

          <Section num="06" title="Notes" required={false}>
            <TextArea
              rows={4}
              placeholder="Where you bought it, who likes it, how to use it…"
              {...register("notes")}
            />
          </Section>

          {serverError && (
            <div className="rounded-md border border-tomato-2 bg-tomato-3 px-3 py-2 font-display text-sm text-tomato-2">
              {serverError}
            </div>
          )}
        </div>

        <aside>
          <div className="rounded-xl border border-paper-3 bg-paper-1 p-6 lg:sticky lg:top-24">
            <div className={cn("caption", "mb-3")}>PREVIEW</div>
            {values.photoUrl ? (
              <div className="relative mb-4 aspect-square w-full overflow-hidden rounded-lg border border-paper-3 bg-paper-0">
                <Image
                  src={values.photoUrl}
                  alt="Item preview"
                  fill
                  sizes="(min-width: 1024px) 320px, 100vw"
                  className="object-cover"
                />
              </div>
            ) : (
              <div className={cn(PH, "mb-4 aspect-square w-full")}>
                {values.name ? values.name.split(" ")[0].toUpperCase() : "PRODUCT SHOT"}
              </div>
            )}
            <div className="caption">
              {(values.category ?? "").toUpperCase()}
              {values.shelf ? ` · ${values.shelf}` : ""}
            </div>
            <div className="mt-2 font-display text-2xl leading-tight">
              {values.name || "Item name"}
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-dashed border-paper-3 pt-3">
              <div className={"num font-display text-2xl"}>
                {formatCount(Number(values.count))}{" "}
                <em className="text-md text-ink-3 italic">{values.unit}</em>
              </div>
              {isLow ? (
                <span className={badge({ tone: "low" })}>
                  <i className={"inline-block h-1.5 w-1.5 rounded-full bg-tomato"} />
                  LOW
                </span>
              ) : (
                <span className={badge({ tone: "ok" })}>
                  <i className={"inline-block h-1.5 w-1.5 rounded-full bg-olive"} />
                  OK
                </span>
              )}
            </div>
            <div className={cn("caption", "mt-4")}>SAVED ITEMS APPEAR IMMEDIATELY IN THE ROOM.</div>
          </div>
        </aside>
      </div>

      <footer className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-paper-3 pt-6 md:mt-24">
        <span className="caption">DRAFT · NOT YET SAVED</span>
        <span className="caption">↵ ON TAG INPUT TO ADD</span>
      </footer>
    </form>
  );
}

function Section({
  num,
  title,
  required,
  children,
}: {
  num: string;
  title: string;
  required: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t border-dashed border-paper-3 pt-6 first:border-t-0 first:pt-0">
      <div className="mb-4 flex items-baseline justify-between">
        <h3 className="m-0 font-display text-2xl tracking-display-sm">
          {num} — {title}
        </h3>
        <span className="font-mono text-2xs tracking-eyebrow text-ink-4">
          {required ? "REQUIRED" : "OPTIONAL"}
        </span>
      </div>
      {children}
    </div>
  );
}
