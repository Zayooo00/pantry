"use client";

import Link from "next/link";
import { useState } from "react";
import { Select } from "@/components/select";
import { button } from "@/components/button";
import { cn } from "@/lib/cn";
import { formatCount, formatDate, formatEventKind } from "@/lib/format";

type Event = {
  id: string;
  kind: string;
  delta: number | null;
  countAfter: number | null;
  note: string | null;
  actor: string | null;
  createdAt: string;
  itemId: string | null;
  itemName: string | null;
  unit: string | null;
  roomId: string | null;
  roomName: string | null;
  roomGlyph: string | null;
};

type RoomLite = { id: string; name: string };

const KINDS = [
  { value: "all", label: "All kinds" },
  { value: "restock", label: "Restocked" },
  { value: "consume", label: "Consumed" },
  { value: "opened", label: "Opened" },
  { value: "created", label: "Created" },
  { value: "low_threshold_crossed", label: "Crossed low" },
];

const PAGE_SIZE = 100;

export function ActivityClient({
  rooms,
  initialEvents,
}: {
  rooms: RoomLite[];
  initialEvents: Event[];
}) {
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [roomId, setRoomId] = useState<string>("all");
  const [kind, setKind] = useState<string>("all");
  const [hasMore, setHasMore] = useState(initialEvents.length === PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function applyFilters(list: Event[]): Event[] {
    return list.filter((e) => {
      if (roomId !== "all" && e.roomId !== roomId) {
        return false;
      }
      if (kind !== "all" && e.kind !== kind) {
        return false;
      }
      return true;
    });
  }

  const visible = applyFilters(events);

  async function loadMore() {
    setLoadingMore(true);
    setError(null);
    const last = events[events.length - 1];
    const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
    if (last) {
      params.set("before", last.createdAt);
    }
    if (roomId !== "all") {
      params.set("roomId", roomId);
    }
    if (kind !== "all") {
      params.set("kind", kind);
    }
    let json: { events: Event[] } | null = null;
    try {
      const res = await fetch(`/api/activity?${params}`);
      if (!res.ok) {
        throw new Error("Couldn't load older events.");
      }
      json = await res.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load older events.");
      setLoadingMore(false);
      return;
    }
    const next = json?.events ?? [];
    setEvents((current) => [...current, ...next]);
    setHasMore(next.length === PAGE_SIZE);
    setLoadingMore(false);
  }

  const totalLoaded = events.length;
  const totalShown = visible.length;

  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-6 md:mb-12">
        <div>
          <div className={cn("caption", "mb-3")}>PANTRY · LEDGER</div>
          <h1 className="m-0 mb-2 font-display text-3xl leading-none font-light tracking-display sm:text-4xl lg:text-6xl">
            <em className="font-normal italic">Activity</em>.
          </h1>
          <div className="mt-3 font-display text-md font-light text-ink-3 italic sm:text-xl">
            {totalLoaded === 0
              ? "Nothing has happened yet."
              : `Showing ${totalShown} of ${totalLoaded} loaded event${totalLoaded === 1 ? "" : "s"}.`}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:items-end">
          <div className="w-50">
            <label className="field-label">Room</label>
            <Select
              value={roomId}
              onChange={(v) => setRoomId(v)}
              size="sm"
              options={[
                { value: "all", label: "All rooms" },
                ...rooms.map((r) => ({ value: r.id, label: r.name })),
              ]}
            />
          </div>
          <div className="w-50">
            <label className="field-label">Kind</label>
            <Select value={kind} onChange={(v) => setKind(v)} size="sm" options={KINDS} />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-paper-3 bg-paper-1">
        {visible.length === 0 ? (
          <div className="p-8 text-center font-display text-ink-3 italic">
            {totalLoaded === 0 ? "No events recorded." : "Nothing matches these filters."}
          </div>
        ) : (
          visible.map((ev) => {
            const row = (
              <>
                <span className="font-mono text-2xs tracking-widest text-ink-4">
                  {formatDate(new Date(ev.createdAt), { dotted: true })}
                </span>
                <span className="min-w-0 truncate">
                  {ev.itemId && ev.itemName ? (
                    <span className="font-display text-base transition-colors group-hover:text-olive-2">
                      {ev.itemName}
                    </span>
                  ) : (
                    <span className="font-display text-base text-ink-3">— deleted item —</span>
                  )}
                  {ev.note ? <span className="text-ink-3"> · {ev.note}</span> : null}
                  <span className={cn("caption", "mt-0.5 block truncate md:hidden")}>
                    {ev.roomName ? `${ev.roomName.toUpperCase()} · ` : ""}
                    {formatEventKind(ev.kind).toUpperCase()}
                  </span>
                </span>
                <span className={cn("caption", "hidden truncate md:inline")}>
                  {ev.roomName ? ev.roomName.toUpperCase() : "—"}
                </span>
                <span className="hidden md:inline">
                  <em className="font-display text-ink-1 italic">{formatEventKind(ev.kind)}</em>
                </span>
                <span className="num text-right font-mono">
                  {ev.delta != null ? (
                    <span className={ev.delta > 0 ? "text-olive-2" : "text-tomato-2"}>
                      {ev.delta > 0 ? "+" : ""}
                      {formatCount(ev.delta)}
                    </span>
                  ) : (
                    <span className="text-ink-4">—</span>
                  )}
                </span>
              </>
            );
            const className =
              "group grid grid-cols-[90px_1fr_60px] items-center gap-3 border-b border-dashed border-paper-3 px-4 py-3 text-sm transition-colors duration-150 ease-pantry last:border-0 md:grid-cols-[110px_1fr_140px_90px_70px] md:gap-4 md:px-6";
            return ev.itemId && ev.itemName ? (
              <Link
                key={ev.id}
                href={`/items/${ev.itemId}`}
                className={cn(className, "hover:bg-paper-2")}
              >
                {row}
              </Link>
            ) : (
              <div key={ev.id} className={className}>
                {row}
              </div>
            );
          })
        )}
      </div>

      {error && (
        <div className="mt-4 rounded-md border border-tomato-2 bg-tomato-3 px-3 py-2 font-display text-sm text-tomato-2">
          {error}
        </div>
      )}

      {hasMore && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={loadingMore}
            className={button({ variant: "secondary" })}
          >
            {loadingMore ? "Loading…" : "Load older events"}
          </button>
        </div>
      )}

      <footer className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-paper-3 pt-6 md:mt-24">
        <span className="caption">PANTRY · LEDGER</span>
        <span className="caption">
          {totalLoaded} EVENT{totalLoaded === 1 ? "" : "S"} LOADED
        </span>
      </footer>
    </>
  );
}
