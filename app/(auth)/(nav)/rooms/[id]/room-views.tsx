"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Item } from "@/db/schema";
import { formatCount, ItemStatus, shortLabel } from "@/lib/format";
import { cn } from "@/lib/cn";
import { badge } from "@/components/badge";
import { chip } from "@/components/chip";
import { level } from "@/components/level";
import { stamp } from "@/components/stamp";
import { Select } from "@/components/select";

type EnrichedItem = Item & { status: ItemStatus; upd: string };

type Layout = "grid" | "list" | "shelf";
type SortKey = "recent" | "name" | "count-asc" | "count-desc" | "expires";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "recent", label: "Recently updated" },
  { value: "name", label: "Name (A→Z)" },
  { value: "count-asc", label: "Count (low→high)" },
  { value: "count-desc", label: "Count (high→low)" },
  { value: "expires", label: "Expires soonest" },
];

function sortItems(items: EnrichedItem[], sort: SortKey): EnrichedItem[] {
  const copy = [...items];
  switch (sort) {
    case "name": {
      return copy.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
    }
    case "count-asc": {
      return copy.sort((a, b) => a.count - b.count);
    }
    case "count-desc": {
      return copy.sort((a, b) => b.count - a.count);
    }
    case "expires": {
      return copy.sort((a, b) => {
        const ax = a.expiresAt ? a.expiresAt.getTime() : Number.POSITIVE_INFINITY;
        const bx = b.expiresAt ? b.expiresAt.getTime() : Number.POSITIVE_INFINITY;
        return ax - bx;
      });
    }
    case "recent":
    default: {
      return copy.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    }
  }
}

export function RoomViews({ items }: { items: EnrichedItem[] }) {
  const [layout, setLayout] = useState<Layout>("grid");
  const [filter, setFilter] = useState<string>("All");
  const [lowOnly, setLowOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>("recent");

  const categories = useMemo(() => {
    return [
      "All",
      ...Array.from(new Set(items.map((i) => i.category).filter(Boolean) as string[])),
    ];
  }, [items]);

  const filtered = useMemo(() => {
    const matching = items.filter((i) => {
      if (lowOnly && i.status !== "low") {
        return false;
      }
      if (filter === "All") {
        return true;
      }
      return i.category === filter;
    });
    return sortItems(matching, sort);
  }, [items, lowOnly, filter, sort]);

  return (
    <>
      <div className="mb-6 flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
        <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto">
          {categories.map((c) => {
            const count = c === "All" ? items.length : items.filter((i) => i.category === c).length;
            return (
              <button
                key={c}
                type="button"
                onClick={() => {
                  setFilter(c);
                  setLowOnly(false);
                }}
                className={chip({ active: filter === c && !lowOnly })}
              >
                {c}
                {c === "All" && (
                  <span className="caption num ml-1.5 text-current">{count}</span>
                )}
              </button>
            );
          })}
          <span className="mx-1.5 h-6 w-px bg-paper-3" />
          <button
            type="button"
            onClick={() => setLowOnly(!lowOnly)}
            className={cn(chip(), "border-tomato-2 text-tomato-2", lowOnly && "bg-tomato-3")}
          >
            Low only
          </button>
        </div>
        <div className="flex items-center gap-3 self-end lg:self-auto">
          <span className={cn("caption","hidden sm:inline")}>SORT</span>
          <div className="w-50">
            <Select
              value={sort}
              onChange={(v) => setSort(v as SortKey)}
              options={SORT_OPTIONS}
              size="sm"
            />
          </div>
          <div className="inline-flex rounded-full border border-paper-3 bg-paper-1 p-0.75">
            {(["grid", "list", "shelf"] as Layout[]).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLayout(l)}
                className={cn(
                  "cursor-pointer rounded-full border-0 px-3 py-1.5 font-mono text-2xs tracking-[0.14em] uppercase transition-colors",
                  layout === l
                    ? "bg-ink-1 text-paper-0"
                    : "bg-transparent text-ink-3 hover:text-ink-1",
                )}
              >
                {l === "grid" && "▦ Grid"}
                {l === "list" && "≡ List"}
                {l === "shelf" && "⌂ Shelf"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {layout === "grid" && <GridView items={filtered} />}
      {layout === "list" && <ListView items={filtered} />}
      {layout === "shelf" && <ShelfView items={filtered} />}
    </>
  );
}

function StatusBadge({ status }: { status: ItemStatus }) {
  if (status === "low") {
    return (
      <span className={badge({ tone: "low" })}>
        <i className={"w-1.5 h-1.5 rounded-full inline-block bg-tomato"} />
        LOW
      </span>
    );
  }
  if (status === "soon") {
    return (
      <span className={badge({ tone: "soon" })}>
        <i className={"w-1.5 h-1.5 rounded-full inline-block bg-amber-pantry"} />
        SOON
      </span>
    );
  }
  return (
    <span className={badge({ tone: "ok" })}>
      <i className={"w-1.5 h-1.5 rounded-full inline-block bg-olive"} />
      OK
    </span>
  );
}

function GridView({ items }: { items: EnrichedItem[] }) {
  if (items.length === 0) {
    return <Empty />;
  }
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
      {items.map((it) => (
        <Link
          key={it.id}
          href={`/items/${it.id}`}
          className="relative flex flex-col gap-3 overflow-hidden rounded-xl border border-paper-3 bg-paper-0 p-4 text-inherit transition-[transform,box-shadow,border-color] duration-200 ease-pantry hover:-translate-y-0.5 hover:border-ink-3 hover:shadow-[0_12px_28px_rgba(26,24,20,0.08),0_1px_0_rgba(26,24,20,0.04)]"
        >
          {it.status === "low" && (
            <span className="absolute top-3 right-3 z-10">
              <span className={stamp({ tone: "tomato" })}>RESTOCK</span>
            </span>
          )}
          <div className="relative grid h-35 w-full place-items-center overflow-hidden rounded-md border border-paper-3 bg-[repeating-linear-gradient(45deg,var(--color-paper-2)_0_6px,var(--color-paper-1)_6px_12px)] font-mono text-2xs tracking-widest text-ink-4 uppercase">
            {shortLabel(it.name, 6)}
          </div>
          <div className="caption">
            {(it.category ?? "").toUpperCase()}
            {it.shelf ? ` · ${it.shelf}` : ""}
          </div>
          <div className="font-display text-xl leading-tight font-normal">{it.name}</div>
          <div className="flex items-baseline justify-between border-t border-dashed border-paper-3 pt-3">
            <div className={"num font-display text-2xl"}>
              {formatCount(it.count)}{" "}
              <em className="text-md font-light text-ink-3 italic">{it.unit}</em>
            </div>
            <StatusBadge status={it.status} />
          </div>
        </Link>
      ))}
    </div>
  );
}

function ListView({ items }: { items: EnrichedItem[] }) {
  if (items.length === 0) {
    return <Empty />;
  }
  return (
    <div className="overflow-hidden rounded-xl border border-paper-3 bg-paper-0">
      <div className="hidden grid-cols-[56px_2fr_100px_140px_120px_80px] gap-4 border-b border-paper-3 bg-paper-1 px-4 py-3 font-mono text-2xs tracking-[0.14em] text-ink-4 uppercase lg:grid">
        <span></span>
        <span>Item</span>
        <span>Count</span>
        <span>Threshold</span>
        <span>Updated</span>
        <span>Status</span>
      </div>
      {items.map((it) => {
        const fill = it.threshold ? Math.min(100, (it.count / it.threshold) * 100) : 100;
        return (
          <Link
            key={it.id}
            href={`/items/${it.id}`}
            className="grid grid-cols-[56px_1fr_auto] items-center gap-3 border-b border-dashed border-paper-3 px-4 py-3 text-inherit transition-[background,transform,box-shadow] duration-150 ease-pantry last:border-0 hover:bg-paper-1 lg:grid-cols-[56px_2fr_100px_140px_120px_80px] lg:gap-4"
          >
            <div className="relative grid h-14 w-14 place-items-center overflow-hidden rounded-md border border-paper-3 bg-[repeating-linear-gradient(45deg,var(--color-paper-2)_0_6px,var(--color-paper-1)_6px_12px)] font-mono text-2xs tracking-widest text-ink-4 uppercase">
              {shortLabel(it.name, 3)}
            </div>
            <div className="min-w-0">
              <div className="truncate font-display text-lg">{it.name}</div>
              <div className={cn("caption","mt-0.5 truncate")}>
                {(it.category ?? "").toUpperCase()}
                {it.shelf ? ` · ${it.shelf}` : ""}
              </div>
              <div className="mt-1.5 flex items-center gap-2 text-xs lg:hidden">
                <span className={"num font-mono"}>
                  {formatCount(it.count)} {it.unit}
                </span>
                {it.threshold && (
                  <span className="caption">/ {formatCount(it.threshold)} floor</span>
                )}
              </div>
            </div>
            <div className="num hidden font-mono lg:block">
              {formatCount(it.count)} {it.unit}
            </div>
            <div className="hidden lg:block">
              <div className="num caption">
                {it.threshold ? `${formatCount(it.threshold)} ${it.unit} floor` : "—"}
              </div>
              <div
                className={cn(
                  level({ tone: it.status === "low" ? "low" : it.status === "soon" ? "soon" : "ok" }),
                  "mt-1",
                )}
              >
                <i style={{ width: `${fill}%` }} />
              </div>
            </div>
            <div className="num caption hidden lg:block">{it.upd}</div>
            <div>
              <StatusBadge status={it.status} />
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function ShelfView({ items }: { items: EnrichedItem[] }) {
  if (items.length === 0) {
    return <Empty />;
  }
  const groups = new Map<string, EnrichedItem[]>();
  for (const it of items) {
    const key = (it.shelf ?? "").trim() || "UNFILED";
    const list = groups.get(key);
    if (list) {
      list.push(it);
    } else {
      groups.set(key, [it]);
    }
  }
  const shelves = Array.from(groups.entries())
    .sort(([a], [b]) => {
      if (a === "UNFILED") {
        return 1;
      }
      if (b === "UNFILED") {
        return -1;
      }
      return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
    })
    .map(([tag, items]) => ({ tag: tag.toUpperCase(), items }));

  return (
    <div className="flex flex-col gap-12">
      {shelves.map((s, idx) => (
        <div key={idx} className="relative pb-4">
          <div className="mb-2 flex justify-between border-b border-dashed border-paper-3 pb-1.5 font-mono text-2xs tracking-[0.18em] text-ink-4 uppercase">
            <span>{s.tag}</span>
            <span>{s.items.length} ITEMS</span>
          </div>
          <div className="flex min-h-45 items-end gap-1.5 overflow-x-auto px-4">
            {s.items.map((it) => {
              const sz =
                it.unit === "kg" || it.unit === "L"
                  ? "tall"
                  : it.unit === "tins" || it.unit === "jars"
                    ? "med"
                    : "short";
              const isBox = it.unit === "pkts" || it.unit === "box";
              const heightMap = { tall: "h-42.5", med: "h-35", short: "h-27.5" };
              const lo = it.status === "low";
              const so = it.status === "soon";
              return (
                <Link
                  key={it.id}
                  href={`/items/${it.id}`}
                  className={cn(
                    "relative flex w-21 shrink-0 flex-col items-center gap-1.5 border-[1.5px] bg-paper-0 p-3 px-2 text-center text-inherit transition-transform hover:-translate-y-1",
                    isBox ? "rounded-sm" : "rounded-t rounded-b-md",
                    lo ? "border-tomato-2" : so ? "border-amber-pantry-2" : "border-ink-1",
                    heightMap[sz as keyof typeof heightMap],
                  )}
                >
                  {!isBox && (
                    <span className="absolute -top-2.5 right-2 left-2 h-2.5 rounded-t-sm bg-ink-1" />
                  )}
                  <div className="line-clamp-2 px-0.5 font-display text-xs leading-tight">
                    {it.name.split(",")[0].split(" ").slice(0, 2).join(" ")}
                  </div>
                  <div
                    className={cn(
                      "w-full border-t border-b border-dashed py-1",
                      lo
                        ? "border-tomato-2 bg-tomato-3"
                        : so
                          ? "border-amber-pantry-2 bg-amber-pantry-3"
                          : "border-paper-3 bg-paper-1",
                    )}
                  >
                    <div className="font-mono text-2xs text-ink-3">
                      {formatCount(it.count)}
                      {it.unit === "kg" || it.unit === "L" ? it.unit : ""}
                    </div>
                  </div>
                  <div className={cn("caption","text-3xs")}>{it.shelf ?? ""}</div>
                </Link>
              );
            })}
          </div>
          <div className="-mt-px h-3.5 rounded-sm border border-ink-2 bg-linear-to-b from-paper-3 to-paper-4 shadow-[0_4px_8px_rgba(26,24,20,0.08)]" />
        </div>
      ))}
    </div>
  );
}

function Empty() {
  return (
    <div className="rounded-xl border border-paper-3 bg-paper-1 p-16 text-center font-display text-ink-3 italic">
      Nothing here yet — add an item to get started.
    </div>
  );
}
