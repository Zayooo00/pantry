"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { button } from "@/components/button";
import { ChevronIcon } from "@/icons";
import { formatCount } from "@/lib/format";
import { cn } from "@/lib/cn";
import { apiClient, invalidateApi, useMutation } from "@/lib/api/client";

type Size = "sm" | "md" | "xl";

const SAVE_DEBOUNCE_MS = 600;

type Variant = "pill" | "native";

export function NumberStepper({
  value,
  onChange,
  step = 1,
  size = "md",
  variant = "pill",
  min = 0,
  ariaLabel = "Count",
  onBlur,
  className,
}: {
  value: number;
  onChange: (next: number) => void;
  step?: number;
  size?: Size;
  variant?: Variant;
  min?: number;
  ariaLabel?: string;
  onBlur?: () => void;
  className?: string;
}) {
  function setNext(raw: number) {
    const safe = Math.max(min, +raw.toFixed(2));
    onChange(safe);
  }

  function bump(delta: number) {
    setNext(value + delta);
  }

  function onTypedChange(raw: string) {
    if (raw === "") {
      setNext(min);
      return;
    }
    const parsed = Number(raw);
    if (Number.isFinite(parsed)) {
      setNext(parsed);
    }
  }

  function onTypedKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      e.currentTarget.blur();
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      bump(step);
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      bump(-step);
    }
  }

  if (variant === "native") {
    return (
      <div
        className={cn(
          "inline-flex items-stretch overflow-hidden rounded-md border border-paper-4 bg-paper-0 transition-[border-color] duration-150 ease-pantry focus-within:border-ink-1 hover:border-ink-3",
          className,
        )}
      >
        <input
          type="text"
          inputMode="decimal"
          value={formatCount(value)}
          onChange={(e) => onTypedChange(e.target.value)}
          onBlur={onBlur}
          onKeyDown={onTypedKey}
          aria-label={ariaLabel}
          className="w-full min-w-0 bg-transparent px-3 py-3 text-center font-sans text-base text-ink-1 tabular-nums outline-none"
        />
        <div className="flex flex-col border-l border-paper-4">
          <button
            type="button"
            onClick={() => bump(step)}
            aria-label="Increase"
            className="flex h-1/2 w-7 cursor-pointer items-center justify-center border-0 bg-transparent text-ink-3 transition-colors hover:bg-paper-2 hover:text-ink-0"
          >
            <ChevronIcon size={10} className="rotate-180" />
          </button>
          <button
            type="button"
            onClick={() => bump(-step)}
            aria-label="Decrease"
            className="flex h-1/2 w-7 cursor-pointer items-center justify-center border-0 border-t border-paper-4 bg-transparent text-ink-3 transition-colors hover:bg-paper-2 hover:text-ink-0"
          >
            <ChevronIcon size={10} />
          </button>
        </div>
      </div>
    );
  }

  const inputClass =
    size === "xl"
      ? "grid place-items-center tabular-nums min-w-22.5 font-mono text-xl font-medium border-l-2 border-r-2 border-ink-1 px-3 bg-transparent text-center outline-none focus:bg-paper-1"
      : "min-w-9 grid place-items-center font-mono text-sm font-medium border-l border-r border-paper-4 px-2 tabular-nums bg-transparent text-center outline-none focus:bg-paper-1";

  const inputEl = (
    <input
      type="text"
      inputMode="decimal"
      value={formatCount(value)}
      onChange={(e) => onTypedChange(e.target.value)}
      onBlur={onBlur}
      onKeyDown={onTypedKey}
      className={inputClass}
      aria-label={ariaLabel}
      style={size === "xl" ? { width: "auto" } : { width: "100%" }}
    />
  );

  if (size === "xl") {
    return (
      <div
        className={cn(
          "inline-flex items-stretch overflow-hidden rounded-full border-2 border-ink-1 bg-paper-0",
          className,
        )}
      >
        <button
          type="button"
          onClick={() => bump(-step)}
          className="grid h-14 w-14 cursor-pointer place-items-center border-0 bg-transparent text-xl text-ink-1 transition-colors hover:bg-paper-2 active:bg-paper-3"
          aria-label="Decrease"
        >
          −
        </button>
        {inputEl}
        <button
          type="button"
          onClick={() => bump(step)}
          className="grid h-14 w-14 cursor-pointer place-items-center border-0 bg-transparent text-xl text-ink-1 transition-colors hover:bg-paper-2 active:bg-paper-3"
          aria-label="Increase"
        >
          +
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex items-stretch overflow-hidden rounded-full border border-paper-4 bg-paper-0",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => bump(-step)}
        aria-label="Decrease"
        className="grid h-8 w-8 place-items-center border-0 bg-transparent text-base text-ink-2 hover:bg-paper-2 hover:text-ink-0"
      >
        −
      </button>
      {inputEl}
      <button
        type="button"
        onClick={() => bump(step)}
        aria-label="Increase"
        className="grid h-8 w-8 place-items-center border-0 bg-transparent text-base text-ink-2 hover:bg-paper-2 hover:text-ink-0"
      >
        +
      </button>
    </div>
  );
}

export function Stepper({
  itemId,
  initialCount,
  step = 1,
  size = "md",
}: {
  itemId: string;
  initialCount: number;
  step?: number;
  size?: Size;
}) {
  const [count, setCount] = useState(initialCount);
  const [, startTransition] = useTransition();
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<number | null>(null);
  const lastSavedRef = useRef<number>(initialCount);

  const { trigger } = useMutation("patch", "/api/items/{id}", {
    onSuccess: () => {
      invalidateApi("/api/sidebar");
      startTransition(() => router.refresh());
    },
  });

  function flush() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const next = pendingRef.current;
    if (next === null || next === lastSavedRef.current) {
      pendingRef.current = null;
      return;
    }
    pendingRef.current = null;
    lastSavedRef.current = next;
    void trigger({
      params: { path: { id: itemId } },
      body: { count: next },
    });
  }

  function flushOnPageHide() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const next = pendingRef.current;
    if (next === null || next === lastSavedRef.current) {
      pendingRef.current = null;
      return;
    }
    pendingRef.current = null;
    lastSavedRef.current = next;
    void apiClient.PATCH("/api/items/{id}", {
      params: { path: { id: itemId } },
      body: { count: next },
      keepalive: true,
    });
  }

  useEffect(() => {
    window.addEventListener("pagehide", flushOnPageHide);
    return () => {
      window.removeEventListener("pagehide", flushOnPageHide);
      flush();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount/unmount-only flush; closures read live refs, not stale deps
  }, []);

  function handleChange(next: number) {
    setCount(next);
    pendingRef.current = next;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(flush, SAVE_DEBOUNCE_MS);
  }

  return (
    <NumberStepper value={count} onChange={handleChange} step={step} size={size} onBlur={flush} />
  );
}

export function AddToShoppingButton({
  itemId,
  label = "＋ to list",
}: {
  itemId: string;
  label?: string;
}) {
  const [done, setDone] = useState(false);
  const { trigger, isMutating } = useMutation("post", "/api/shopping", {
    onSuccess: () => invalidateApi("/api/sidebar"),
  });

  async function add() {
    await trigger({ body: { itemId } });
    setDone(true);
  }

  return (
    <button
      onClick={add}
      disabled={isMutating || done}
      className={button({ variant: "ghost", size: "sm" })}
    >
      {done ? "✓ added" : label}
    </button>
  );
}
