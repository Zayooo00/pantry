"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

export type SelectOption = { value: string; label: string; description?: string };

export function Select({
  value,
  onChange,
  options,
  placeholder = "Select…",
  disabled,
  size = "md",
}: {
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  size?: "sm" | "md";
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((a) => Math.min(options.length - 1, a + 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((a) => Math.max(0, a - 1));
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const opt = options[active];
        if (opt) {
          onChange(opt.value);
          setOpen(false);
        }
      }
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, active, options, onChange]);

  function toggleOpen() {
    if (!open) {
      const idx = options.findIndex((o) => o.value === value);
      setActive(idx >= 0 ? idx : 0);
    }
    setOpen(!open);
  }

  const current = options.find((o) => o.value === value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        className={cn(
          "flex justify-between items-center w-full bg-paper-0 border border-paper-4 rounded-md font-sans text-ink-1 cursor-pointer transition-[border-color] duration-150 ease-pantry text-left hover:border-ink-3 data-[open=true]:border-ink-1",
          size === "sm" ? "px-2.5 py-1.5 text-sm" : "px-3.5 py-3 text-base",
        )}
        data-open={open}
        onClick={toggleOpen}
      >
        <span className={cn(current ? "text-ink-1" : "text-ink-4")}>
          {current?.label ?? placeholder}
        </span>
        <span className="text-ink-4 transition-transform duration-150 ease-pantry data-[open=true]:rotate-180 data-[open=true]:text-ink-2" data-open={open}>
          ▾
        </span>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-paper-0 border border-ink-1 rounded-md shadow-[0_12px_32px_rgba(26,24,20,0.12)] p-1 max-h-70 overflow-y-auto animate-[pantry-pop_0.15s_var(--ease-pantry)]">
          {options.map((opt, i) => (
            <button
              key={opt.value}
              type="button"
              className="w-full text-left px-3 py-2.5 rounded-sm bg-transparent border-0 font-sans text-sm text-ink-1 cursor-pointer transition-[background] duration-120 ease-pantry flex items-center gap-2.5 hover:bg-paper-2 data-[active=true]:bg-paper-2 data-[selected=true]:bg-ink-1 data-[selected=true]:text-paper-0 data-[selected=true]:hover:bg-ink-0"
              data-active={i === active}
              data-selected={opt.value === value}
              onMouseEnter={() => setActive(i)}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
            >
              <span className="flex-1">{opt.label}</span>
              {opt.description && (
                <span className="font-mono text-2xs opacity-60">{opt.description}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
