"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SearchIcon } from "@/icons";
import { Kbd, useIsMac } from "./kbd";
import { ThemeToggle } from "./theme";
import { button } from "@/components/button";

export function Topbar({
  placeholder = "Search across all rooms…",
  onOpenDrawer,
}: {
  placeholder?: string;
  onOpenDrawer?: () => void;
}) {
  const mac = useIsMac();
  const [today, setToday] = useState<{ dd: string; mm: string; yy: string; dow: string }>({
    dd: "—", mm: "—", yy: "—", dow: "—",
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
    <header className="flex items-center justify-between gap-3 md:gap-6 sticky top-0 z-30 px-4 py-3 md:px-8 md:py-4 border-b border-paper-3 bg-paper-0">
      <button
        type="button"
        onClick={onOpenDrawer}
        className="md:hidden w-8 h-8 rounded-full border border-transparent bg-transparent text-ink-2 grid place-items-center cursor-pointer transition-all duration-150 ease-pantry hover:bg-paper-2 hover:text-ink-0 hover:border-paper-3 active:scale-95 shrink-0"
        aria-label="Open menu"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <line x1="3" y1="5" x2="15" y2="5" />
          <line x1="3" y1="9" x2="15" y2="9" />
          <line x1="3" y1="13" x2="15" y2="13" />
        </svg>
      </button>
      <button
        type="button"
        onClick={openPalette}
        className="flex items-center gap-3 flex-1 max-w-130 bg-paper-1 border border-paper-3 rounded-full px-3 md:px-4 py-2 hover:border-ink-3 hover:bg-paper-2 transition-colors text-left cursor-pointer min-w-0"
      >
        <SearchIcon size={14} />
        <span className="flex-1 text-sm text-ink-4 truncate">{placeholder}</span>
        <span className="hidden sm:inline-flex"><Kbd keys={["Mod", "K"]} /></span>
      </button>
      <div className="flex items-center gap-3 shrink-0">
        <span className="hidden lg:inline font-mono text-xs tracking-[0.06em] uppercase text-ink-4">{today.dd}.{today.mm}.{today.yy} · {today.dow}</span>
        <span className="w-px h-5 bg-paper-3 hidden lg:inline" />
        <ThemeToggle />
        <Link href="/items/new" className={button({ variant: "primary", size: "sm" })}>
          <span className="hidden sm:inline">＋ Add item</span>
          <span className="sm:hidden">＋</span>
        </Link>
      </div>
    </header>
  );
}
