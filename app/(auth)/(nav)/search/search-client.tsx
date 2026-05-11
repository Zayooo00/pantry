"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { AddToShoppingButton } from "@/components/stepper";
import { Checkbox } from "@/components/checkbox";
import { ModKey } from "@/components/kbd";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/badge";
import { Button } from "@/components/button";
import { Chip } from "@/components/chip";
import { Level } from "@/components/level";

import { formatCount, ItemStatus } from "@/lib/format";
import { ItemThumbnail } from "@/components/item-thumbnail";
import type { Item as ItemRow, Room as RoomRow } from "@/db/schema";

type RoomLite = Pick<RoomRow, "id" | "name">;
type ItemLite = Pick<
  ItemRow,
  | "id"
  | "name"
  | "brand"
  | "barcode"
  | "roomId"
  | "category"
  | "shelf"
  | "count"
  | "unit"
  | "threshold"
  | "photoUrl"
> & { status: ItemStatus };
type StatusFilter = "all" | "low" | "soon";

export function SearchClient({
  initialQuery,
  initialStatus,
  rooms,
  items,
}: {
  initialQuery: string;
  initialStatus: StatusFilter;
  rooms: RoomLite[];
  items: ItemLite[];
}) {
  const [q, setQ] = useState(initialQuery);
  const [activeRooms, setActiveRooms] = useState<Set<string>>(new Set());
  const [activeCategories, setActiveCategories] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(initialStatus);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const roomById = useMemo(() => new Map(rooms.map((r) => [r.id, r])), [rooms]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter((i) => {
      if (activeRooms.size > 0 && !activeRooms.has(i.roomId)) {
        return false;
      }
      if (activeCategories.size > 0 && (!i.category || !activeCategories.has(i.category))) {
        return false;
      }
      if (statusFilter !== "all" && i.status !== statusFilter) {
        return false;
      }
      if (needle) {
        const room = roomById.get(i.roomId);
        const haystack = [
          i.name,
          i.brand ?? "",
          i.category ?? "",
          i.shelf ?? "",
          i.barcode ?? "",
          room?.name ?? "",
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(needle)) {
          return false;
        }
      }
      return true;
    });
  }, [items, q, activeRooms, activeCategories, statusFilter, roomById]);

  function toggleRoom(id: string) {
    setActiveRooms((s) => {
      const next = new Set(s);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleCategory(name: string) {
    setActiveCategories((s) => {
      const next = new Set(s);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  }

  const facetRooms = rooms.map((r) => ({
    ...r,
    count: items.filter((i) => i.roomId === r.id).length,
  }));
  const facetStatus = {
    low: items.filter((i) => i.status === "low").length,
    soon: items.filter((i) => i.status === "soon").length,
    ok: items.filter((i) => i.status === "ok").length,
  };
  const categories = Array.from(new Set(items.map((i) => i.category).filter(Boolean))) as string[];

  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-6 md:mb-12">
        <div>
          <div className="caption">
            SEARCH · {items.length} ITEMS · {rooms.length} ROOMS
          </div>
          <h1 className="m-0 mt-2 font-display text-3xl leading-none font-light tracking-display sm:text-4xl lg:text-6xl">
            Find the <em className="font-normal italic">jar</em>.
          </h1>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 items-center gap-4 rounded-xl border border-paper-3 bg-paper-0 px-5 py-4 transition-colors focus-within:border-ink-1 md:grid-cols-[1fr_auto] md:gap-6 md:px-8 md:py-6">
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape" && q) {
              e.preventDefault();
              setQ("");
            }
          }}
          placeholder="Search by name, brand, barcode, room…"
          autoFocus
          aria-label="Search"
          className="w-full border-0 bg-transparent font-display text-xl leading-tight font-light tracking-display-md text-ink-1 outline-none placeholder:text-ink-4 placeholder:italic sm:text-2xl lg:text-4xl"
        />
        <div className="flex items-center gap-3">
          <span className="caption">
            {filtered.length} RESULT{filtered.length === 1 ? "" : "S"}
          </span>
          {q && (
            <Button variant="ghost" size="sm" onClick={() => setQ("")} aria-label="Clear search">
              Clear
            </Button>
          )}
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2 lg:hidden">
        <Chip active={activeRooms.size === 0} onClick={() => setActiveRooms(new Set())}>
          All
        </Chip>
        <Chip
          className={cn(
            "border-tomato-2 text-tomato-2 hover:bg-tomato-3",
            statusFilter === "low" && "bg-tomato-2 text-paper-0 hover:bg-tomato-2",
          )}
          onClick={() => setStatusFilter(statusFilter === "low" ? "all" : "low")}
        >
          Low ({facetStatus.low})
        </Chip>
        <Chip
          className={cn(
            "border-amber-pantry-2 text-amber-pantry-2 hover:bg-amber-pantry-3",
            statusFilter === "soon" && "bg-amber-pantry-2 text-paper-0 hover:bg-amber-pantry-2",
          )}
          onClick={() => setStatusFilter(statusFilter === "soon" ? "all" : "soon")}
        >
          Expiring ({facetStatus.soon})
        </Chip>
      </div>

      <div className="mb-6 hidden flex-wrap gap-2 lg:flex">
        <Chip active={activeRooms.size === 0} onClick={() => setActiveRooms(new Set())}>
          All rooms
        </Chip>
        {rooms.map((r) => (
          <Chip key={r.id} active={activeRooms.has(r.id)} onClick={() => toggleRoom(r.id)}>
            {r.name}
          </Chip>
        ))}
        <span className="mx-1.5 h-6 w-px bg-paper-3" />
        <Chip active={statusFilter === "all"} onClick={() => setStatusFilter("all")}>
          All status
        </Chip>
        <Chip
          className={cn(
            "border-tomato-2 text-tomato-2 hover:bg-tomato-3",
            statusFilter === "low" && "bg-tomato-2 text-paper-0 hover:bg-tomato-2",
          )}
          onClick={() => setStatusFilter(statusFilter === "low" ? "all" : "low")}
        >
          Low only
        </Chip>
        <Chip
          className={cn(
            "border-amber-pantry-2 text-amber-pantry-2 hover:bg-amber-pantry-3",
            statusFilter === "soon" && "bg-amber-pantry-2 text-paper-0 hover:bg-amber-pantry-2",
          )}
          onClick={() => setStatusFilter(statusFilter === "soon" ? "all" : "soon")}
        >
          Expiring
        </Chip>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_280px] lg:gap-12">
        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-paper-3 py-3">
            <div className="font-display text-lg md:text-xl">
              {filtered.length} result{filtered.length === 1 ? "" : "s"}
              {q && (
                <>
                  {" "}
                  for <em className="italic">"{q}"</em>
                </>
              )}
            </div>
            <span className={cn("caption", "hidden sm:inline")}>
              <ModKey /> K FOR QUICK SEARCH
            </span>
          </div>

          <div className="overflow-hidden rounded-xl border border-paper-3 bg-paper-0">
            {filtered.length === 0 ? (
              <div className="p-16 text-center font-display text-ink-3 italic">
                Nothing matches.
              </div>
            ) : (
              filtered.map((it) => {
                const room = roomById.get(it.roomId);
                const fill = it.threshold ? Math.min(100, (it.count / it.threshold) * 100) : 100;
                return (
                  <div
                    key={it.id}
                    className="grid grid-cols-[56px_1fr_auto] items-center gap-3 border-b border-dashed border-paper-3 px-4 py-4 transition-[background,transform,box-shadow] duration-150 ease-pantry last:border-0 hover:bg-paper-1 sm:grid-cols-[56px_2fr_1fr_100px_80px] sm:gap-4 sm:px-6"
                  >
                    <Link href={`/items/${it.id}`} className="block h-14 w-14">
                      <ItemThumbnail
                        name={it.name}
                        photoUrl={it.photoUrl}
                        className="h-14 w-14"
                        sizes="56px"
                      />
                    </Link>
                    <div className="min-w-0">
                      <Link
                        href={`/items/${it.id}`}
                        className="block truncate font-display text-lg transition-colors hover:text-olive-2"
                      >
                        {it.name}
                      </Link>
                      <div className={cn("caption", "mt-0.5 truncate")}>
                        {(it.category ?? "").toUpperCase()}
                        {room ? ` · ${room.name.toUpperCase()}` : ""}
                        {it.shelf ? ` / ${it.shelf}` : ""}
                      </div>
                      <div className="mt-1.5 sm:hidden">
                        <div className={"caption num"}>
                          {formatCount(it.count)}
                          {it.threshold ? ` / ${formatCount(it.threshold)}` : ""} {it.unit}
                        </div>
                        <Level
                          tone={it.status === "low" ? "low" : it.status === "soon" ? "soon" : "ok"}
                          value={fill}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <div className="hidden sm:block">
                      <div className={"caption num"}>
                        {formatCount(it.count)}
                        {it.threshold ? ` / ${formatCount(it.threshold)}` : ""} {it.unit}
                      </div>
                      <Level
                        tone={it.status === "low" ? "low" : it.status === "soon" ? "soon" : "ok"}
                        value={fill}
                        className="mt-1"
                      />
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-2 sm:contents">
                      {it.status === "low" ? (
                        <Badge tone="low">LOW</Badge>
                      ) : it.status === "soon" ? (
                        <Badge tone="soon">SOON</Badge>
                      ) : (
                        <Badge tone="ok">OK</Badge>
                      )}
                      {it.status === "low" ? (
                        <AddToShoppingButton itemId={it.id} />
                      ) : (
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/items/${it.id}`}>View</Link>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <aside className="hidden lg:block">
          <Facet title="Room">
            {facetRooms.map((r) => (
              <FacetRow
                key={r.id}
                label={r.name}
                count={r.count}
                checked={activeRooms.size === 0 || activeRooms.has(r.id)}
                onChange={() => toggleRoom(r.id)}
              />
            ))}
          </Facet>
          <Facet title="Status">
            <FacetRow
              label="Low only"
              count={facetStatus.low}
              checked={statusFilter === "low"}
              onChange={() => setStatusFilter(statusFilter === "low" ? "all" : "low")}
            />
            <FacetRow
              label="Expiring"
              count={facetStatus.soon}
              checked={statusFilter === "soon"}
              onChange={() => setStatusFilter(statusFilter === "soon" ? "all" : "soon")}
            />
            <FacetRow
              label="In stock"
              count={facetStatus.ok}
              checked={statusFilter === "all"}
              onChange={() => setStatusFilter("all")}
            />
          </Facet>
          {categories.length > 0 && (
            <Facet title="Category">
              {categories.map((c) => (
                <FacetRow
                  key={c}
                  label={c}
                  count={items.filter((i) => i.category === c).length}
                  checked={activeCategories.size === 0 || activeCategories.has(c)}
                  onChange={() => toggleCategory(c)}
                />
              ))}
            </Facet>
          )}
        </aside>
      </div>

      <footer className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-paper-3 pt-6 md:mt-24">
        <span className="caption">
          SEARCH · {filtered.length} / {items.length} ITEMS
        </span>
        <span className="caption">
          <ModKey /> K FROM ANYWHERE
        </span>
      </footer>
    </>
  );
}

function Facet({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 rounded-xl border border-paper-3 bg-paper-1 p-4">
      <h4 className="m-0 mb-3 font-display text-md tracking-display-sm">{title}</h4>
      {children}
    </div>
  );
}

function FacetRow({
  label,
  count,
  checked,
  onChange,
}: {
  label: string;
  count: number;
  checked: boolean;
  onChange?: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between py-1.5 text-sm text-ink-2 transition-colors hover:text-ink-0">
      <span className="flex items-center gap-2">
        <Checkbox checked={checked} onChange={onChange ? () => onChange() : undefined} />
        {label}
      </span>
      <span className={"num caption"}>{count}</span>
    </label>
  );
}
