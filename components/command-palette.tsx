"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { groupBy } from "lodash-es";
import { Modal } from "./modal";
import { useIsMac } from "./kbd";
import { useQuery } from "@/lib/api/client";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const mac = useIsMac();

  const { data: sidebar } = useQuery("/api/sidebar");
  const { data: searchData } = useQuery(
    "/api/search",
    query ? { params: { query: { q: query } } } : null,
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const cmdK = (e.key === "k" || e.key === "K") && (mac ? e.metaKey : e.ctrlKey);
      if (cmdK) {
        e.preventDefault();
        setOpen((o) => !o);
        setQuery("");
        setActive(0);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mac]);

  type Action = { id: string; label: string; sub?: string; run: () => void; section: string };

  const actions: Action[] = useMemo(() => {
    const base: Action[] = [
      {
        id: "go-dashboard",
        section: "Navigate",
        label: "Dashboard",
        sub: "Morning glance",
        run: () => router.push("/dashboard"),
      },
      { id: "go-rooms", section: "Navigate", label: "All rooms", run: () => router.push("/rooms") },
      { id: "go-search", section: "Navigate", label: "Search", run: () => router.push("/search") },
      {
        id: "go-shopping",
        section: "Navigate",
        label: "Shopping list",
        run: () => router.push("/shopping"),
      },
      {
        id: "go-settings",
        section: "Navigate",
        label: "Settings",
        run: () => router.push("/settings"),
      },
      {
        id: "act-add",
        section: "Actions",
        label: "Add new item",
        sub: "Create from scratch",
        run: () => router.push("/items/new"),
      },
    ];
    for (const r of sidebar?.rooms ?? []) {
      base.push({
        id: `room-${r.id}`,
        section: "Rooms",
        label: r.name,
        sub: `${r.count} items${r.low > 0 ? ` · ${r.low} low` : ""}`,
        run: () => router.push(`/rooms/${r.id}`),
      });
    }
    for (const it of searchData?.items ?? []) {
      base.push({
        id: `item-${it.id}`,
        section: "Items",
        label: it.name,
        sub: it.category ?? undefined,
        run: () => router.push(`/items/${it.id}`),
      });
    }
    return base;
  }, [router, sidebar, searchData]);

  const filtered = useMemo(() => {
    if (!query.trim()) {
      return actions;
    }
    const q = query.toLowerCase();
    return actions.filter(
      (a) => a.label.toLowerCase().includes(q) || a.sub?.toLowerCase().includes(q),
    );
  }, [actions, query]);

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>('[data-active="true"]');
    el?.scrollIntoView({ block: "nearest" });
  }, [active]);

  function onQueryChange(next: string) {
    setQuery(next);
    setActive(0);
  }

  function go(action: Action) {
    setOpen(false);
    setQuery("");
    action.run();
  }

  function onInputKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(filtered.length - 1, a + 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const a = filtered[active];
      if (a) {
        go(a);
      }
    }
  }

  const grouped = useMemo(() => {
    const indexed = filtered.map((action, idx) => ({ idx, action }));
    return Object.entries(groupBy(indexed, (x) => x.action.section));
  }, [filtered]);

  return (
    <Modal open={open} onClose={() => setOpen(false)} width={620}>
      <div className="-mt-2">
        <input
          autoFocus
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={onInputKey}
          placeholder="Search items, rooms, actions…"
          className="mb-4 w-full border-0 border-b border-paper-3 bg-transparent px-1 pt-2 pb-4 font-display text-2xl font-light tracking-display-sm text-ink-1 outline-none"
        />
        <div ref={listRef} className="max-h-105 overflow-y-auto">
          {filtered.length === 0 && (
            <div className="p-8 text-center font-display text-ink-3 italic">Nothing matches.</div>
          )}
          {grouped.map(([section, rows]) => (
            <div key={section} className="mb-3">
              <div className="caption mb-1 px-3 py-1">{section}</div>
              {rows.map(({ idx, action }) => (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => go(action)}
                  onMouseEnter={() => setActive(idx)}
                  data-active={idx === active}
                  className="flex w-full cursor-pointer items-center gap-2.5 rounded-sm border-0 bg-transparent px-3 py-2.5 text-left font-sans text-sm text-ink-1 transition-[background] duration-120 ease-pantry hover:bg-paper-2 data-[active=true]:bg-paper-2"
                >
                  <span className="flex-1 font-display text-base">{action.label}</span>
                  {action.sub && (
                    <span className="font-mono text-xs tracking-mono uppercase opacity-70">
                      {action.sub}
                    </span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>
        <div className="mt-2 flex items-center justify-between border-t border-paper-3 pt-3">
          <span className="caption">↑ ↓ NAVIGATE · ↵ OPEN · ESC CLOSE</span>
          <span className="caption">
            {filtered.length} RESULT{filtered.length === 1 ? "" : "S"}
          </span>
        </div>
      </div>
    </Modal>
  );
}
