"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MenuIcon, SearchIcon } from "@/icons";
import { Kbd, useIsMac } from "./kbd";
import { ThemeToggle } from "./theme";
import { Button } from "@/components/button";

export function Topbar({
  placeholder = "Search across all rooms…",
  onOpenDrawer,
}: {
  placeholder?: string;
  onOpenDrawer?: () => void;
}) {
  const mac = useIsMac();
  const [today, setToday] = useState<{ dd: string; mm: string; yy: string; dow: string }>({
    dd: "—",
    mm: "—",
    yy: "—",
    dow: "—",
  });

  useEffect(() => {
    const d = new Date();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot client-only init to avoid SSR/CSR mismatch
    setToday({
      dd: String(d.getDate()).padStart(2, "0"),
      mm: String(d.getMonth() + 1).padStart(2, "0"),
      yy: String(d.getFullYear()).slice(2),
      dow: ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][d.getDay()],
    });
  }, []);

  function openPalette() {
    const e = new KeyboardEvent("keydown", {
      key: "k",
      metaKey: mac,
      ctrlKey: !mac,
      bubbles: true,
    });
    window.dispatchEvent(e);
  }

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-paper-3 bg-paper-0 px-4 py-3 md:gap-6 md:px-8 md:py-4">
      <button
        type="button"
        onClick={onOpenDrawer}
        className="grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-full border border-transparent bg-transparent text-ink-2 transition-all duration-150 ease-pantry hover:border-paper-3 hover:bg-paper-2 hover:text-ink-0 active:scale-95 md:hidden"
        aria-label="Open menu"
      >
        <MenuIcon size={18} />
      </button>
      <button
        type="button"
        onClick={openPalette}
        className="flex max-w-130 min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-full border border-paper-3 bg-paper-1 px-3 py-2 text-left transition-colors hover:border-ink-3 hover:bg-paper-2 md:px-4"
      >
        <SearchIcon size={14} />
        <span className="flex-1 truncate text-sm text-ink-4">{placeholder}</span>
        <span className="hidden sm:inline-flex">
          <Kbd keys={["Mod", "K"]} />
        </span>
      </button>
      <div className="flex shrink-0 items-center gap-3">
        <span className="hidden font-mono text-xs tracking-mono text-ink-4 uppercase lg:inline">
          {today.dd}.{today.mm}.{today.yy} · {today.dow}
        </span>
        <span className="hidden h-5 w-px bg-paper-3 lg:inline" />
        <ThemeToggle />
        <Button asChild variant="primary" size="sm">
          <Link href="/items/new">
            <span className="hidden sm:inline">＋ Add item</span>
            <span className="sm:hidden">＋</span>
          </Link>
        </Button>
      </div>
    </header>
  );
}
