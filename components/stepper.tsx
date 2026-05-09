"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { mutate as globalMutate } from "swr";
import { button } from "@/components/button";
import { formatCount } from "@/lib/format";
import { useMutation } from "@/lib/api/client";

type Size = "sm" | "md" | "xl";

const SAVE_DEBOUNCE_MS = 600;

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
      globalMutate(["pantry", "/api/sidebar"]);
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

  useEffect(() => {
    function onUnload() {
      flush();
    }
    window.addEventListener("beforeunload", onUnload);
    return () => {
      window.removeEventListener("beforeunload", onUnload);
      flush();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount/unmount-only flush; the closures read live refs, not stale deps
  }, []);

  function setNext(next: number) {
    const safe = Math.max(0, +next.toFixed(2));
    setCount(safe);
    pendingRef.current = safe;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(flush, SAVE_DEBOUNCE_MS);
    return safe;
  }

  function bump(delta: number) {
    setNext(count + delta);
  }

  function onTypedChange(raw: string) {
    if (raw === "") {
      setNext(0);
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
  }

  const inputClass =
    size === "xl"
      ? "grid place-items-center tabular-nums min-w-22.5 font-mono text-xl font-medium border-l-2 border-r-2 border-ink-1 px-3 bg-transparent text-center outline-none focus:bg-paper-1"
      : "min-w-9 grid place-items-center font-mono text-sm font-medium border-l border-r border-paper-4 px-2 tabular-nums bg-transparent text-center outline-none focus:bg-paper-1";

  const inputEl = (
    <input
      type="text"
      inputMode="decimal"
      value={formatCount(count)}
      onChange={(e) => onTypedChange(e.target.value)}
      onBlur={flush}
      onKeyDown={onTypedKey}
      className={inputClass}
      aria-label="Count"
      style={size === "xl" ? { width: "auto" } : { width: "100%" }}
    />
  );

  if (size === "xl") {
    return (
      <div className="inline-flex items-stretch overflow-hidden border-2 border-ink-1 rounded-full bg-paper-0">
        <button
          onClick={() => bump(-step)}
          className="w-14 h-14 bg-transparent border-0 text-xl text-ink-1 grid place-items-center"
          aria-label="Decrease"
        >
          −
        </button>
        {inputEl}
        <button
          onClick={() => bump(step)}
          className="w-14 h-14 bg-transparent border-0 text-xl text-ink-1 grid place-items-center"
          aria-label="Increase"
        >
          +
        </button>
      </div>
    );
  }

  return (
    <div className="inline-flex items-stretch border border-paper-4 rounded-full overflow-hidden bg-paper-0">
      <button
        onClick={() => bump(-step)}
        aria-label="Decrease"
        className="w-8 h-8 bg-transparent border-0 text-ink-2 text-base grid place-items-center hover:bg-paper-2 hover:text-ink-0"
      >
        −
      </button>
      {inputEl}
      <button
        onClick={() => bump(step)}
        aria-label="Increase"
        className="w-8 h-8 bg-transparent border-0 text-ink-2 text-base grid place-items-center hover:bg-paper-2 hover:text-ink-0"
      >
        +
      </button>
    </div>
  );
}

export function AddToShoppingButton({ itemId, label = "＋ to list" }: { itemId: string; label?: string }) {
  const [done, setDone] = useState(false);
  const { trigger, isMutating } = useMutation("post", "/api/shopping", {
    onSuccess: () => globalMutate(["pantry", "/api/sidebar"]),
  });

  async function add() {
    await trigger({ body: { itemId } });
    setDone(true);
  }

  return (
    <button onClick={add} disabled={isMutating || done} className={button({ variant: "ghost", size: "sm" })}>
      {done ? "✓ added" : label}
    </button>
  );
}
