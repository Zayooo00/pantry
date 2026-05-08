"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { mutate as globalMutate } from "swr";
import { groupBy, sumBy } from "lodash-es";
import { Checkbox } from "@/components/checkbox";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useToast } from "@/components/toast";
import { cn } from "@/lib/cn";
import { button } from "@/components/button";
import { chip } from "@/components/chip";
import { stamp } from "@/components/stamp";
import { formatCount } from "@/lib/format";
import { useMutation } from "@/lib/api/client";

const TOGGLE_DEBOUNCE_MS = 400;

type Row = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  reason: string | null;
  groupName: string;
  estPrice: number | null;
  done: boolean;
  source: string;
};

export function ShoppingList({
  initialItems,
  tripNumber,
}: {
  initialItems: Row[];
  tripNumber: number;
}) {
  const tripLabel = String(tripNumber).padStart(4, "0");
  const router = useRouter();
  const { data: session } = useSession();
  const { toast } = useToast();
  const [items, setItems] = useState<Row[]>(initialItems);
  const [view, setView] = useState<"all" | "outstanding">("all");
  const [completeOpen, setCompleteOpen] = useState(false);
  const [todayLabel, setTodayLabel] = useState("");
  useEffect(() => {
    setTodayLabel(new Date().toLocaleDateString());
  }, []);

  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const pendingDoneRef = useRef<Map<string, boolean>>(new Map());
  const inFlightRef = useRef<Set<Promise<unknown>>>(new Set());

  const { trigger: triggerToggle } = useMutation("patch", "/api/shopping/{id}", {
    onSuccess: () => globalMutate(["pantry", "/api/sidebar"]),
  });
  const { trigger: triggerClear } = useMutation("post", "/api/shopping/clear-done", {
    onSuccess: () => globalMutate(["pantry", "/api/sidebar"]),
  });

  function flushToggle(id: string): Promise<unknown> | undefined {
    const timers = timersRef.current;
    const pending = pendingDoneRef.current;
    const timer = timers.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.delete(id);
    }
    if (!pending.has(id)) {
      return undefined;
    }
    const done = pending.get(id)!;
    pending.delete(id);
    const p = triggerToggle({ params: { path: { id } }, body: { done } });
    inFlightRef.current.add(p);
    p.finally(() => inFlightRef.current.delete(p));
    return p;
  }

  useEffect(() => {
    function onUnload() {
      for (const id of timersRef.current.keys()) {
        flushToggle(id);
      }
    }
    window.addEventListener("beforeunload", onUnload);
    return () => {
      window.removeEventListener("beforeunload", onUnload);
      onUnload();
    };
     
  }, []);

  const visible = view === "outstanding" ? items.filter((i) => !i.done) : items;
  const groups = groupBy(visible, "groupName");

  const total = sumBy(items.filter((i) => !i.done), (i) => i.estPrice ?? 0);
  const auto = items.filter((i) => i.source === "auto").length;
  const manual = items.filter((i) => i.source === "manual").length;
  const outstanding = items.filter((i) => !i.done).length;
  const checkedCount = items.filter((i) => i.done).length;

  function toggle(id: string) {
    const item = items.find((i) => i.id === id);
    if (!item) {
      return;
    }
    const nextDone = !item.done;
    setItems((current) =>
      current.map((i) => (i.id === id ? { ...i, done: nextDone } : i)),
    );
    pendingDoneRef.current.set(id, nextDone);
    const existing = timersRef.current.get(id);
    if (existing) {
      clearTimeout(existing);
    }
    timersRef.current.set(id, setTimeout(() => flushToggle(id), TOGGLE_DEBOUNCE_MS));
  }

  async function clearDone() {
    for (const id of Array.from(timersRef.current.keys())) {
      flushToggle(id);
    }
    await Promise.allSettled(Array.from(inFlightRef.current));
    await triggerClear({});
    setItems((current) => current.filter((i) => !i.done));
    toast(
      <>
        Trip <em>complete</em>. {checkedCount} item{checkedCount === 1 ? "" : "s"} cleared.
      </>,
    );
    router.refresh();
  }

  function exportList() {
    const lines: string[] = [];
    lines.push("PANTRY · SHOPPING LIST");
    lines.push(new Date().toLocaleString());
    lines.push("");
    for (const [g, rows] of Object.entries(groups)) {
      lines.push(`-- ${g} --`);
      for (const it of rows) {
        const mark = it.done ? "[x]" : "[ ]";
        const price = it.estPrice ? ` — $${it.estPrice.toFixed(2)}` : "";
        const reason = it.reason ? ` (${it.reason})` : "";
        lines.push(`${mark} ${formatCount(it.quantity)} ${it.unit}  ${it.name}${reason}${price}`);
      }
      lines.push("");
    }
    lines.push(`EST. TOTAL · $${total.toFixed(2)}`);
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pantry-shopping-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast(<>Exported.</>);
  }

  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-6 md:mb-12">
        <div>
          <div className="caption">{items.length} ITEMS · BUILT FROM LOW STOCK + MANUAL</div>
          <h1 className="m-0 mt-2 font-display text-3xl leading-none font-light tracking-[-0.03em] sm:text-4xl lg:text-6xl">
            Shopping <em className="font-normal italic">list</em>.
          </h1>
          <div className="mt-3 font-display text-md font-light text-ink-3 italic sm:text-xl">
            For the next trip out.
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => window.print()} className={cn(button({ variant: "ghost" }), "no-print")}>
            Print
          </button>
          <button onClick={exportList} className={cn(button({ variant: "secondary" }), "no-print")}>
            Export
          </button>
          <button
            onClick={() => setCompleteOpen(true)}
            disabled={checkedCount === 0}
            className={cn(button({ variant: "primary" }), "no-print")}
          >
            Mark trip complete
          </button>
        </div>
      </div>

      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <button
            onClick={() => setView("all")}
            className={chip({ active: view === "all" })}
          >
            All ({items.length})
          </button>
          <button
            onClick={() => setView("outstanding")}
            className={chip({ active: view === "outstanding" })}
          >
            Outstanding ({outstanding})
          </button>
        </div>
        <span className="caption">
          AUTO-ADDED {auto} · MANUAL {manual}
        </span>
      </div>

      <div className="relative mx-auto max-w-180 rounded-xl border border-paper-3 bg-paper-0 bg-[repeating-linear-gradient(0deg,transparent_0_31px,rgba(26,24,20,0.04)_31px_32px)] px-5 py-6 shadow-[0_2px_0_rgba(26,24,20,0.04),0_12px_40px_rgba(26,24,20,0.06)] md:px-12 md:py-12">
        <div className="no-print absolute top-4 right-4 md:top-6 md:right-8">
          <span className={stamp()}>No. {tripLabel}</span>
        </div>
        <div className="mb-6 border-b-[1.5px] border-ink-1 pb-4 text-center">
          <div className={cn("caption","mb-2")}>PANTRY · SHOPPING LIST</div>
          <h2 className="m-0 font-display text-2xl font-light tracking-[-0.02em] md:text-4xl">
            Today's <em className="italic">errands</em>.
          </h2>
          <div className="mt-3 font-mono text-2xs tracking-[0.18em] text-ink-3 uppercase">
            {todayLabel} · {items.length} ITEMS
          </div>
        </div>

        {Object.entries(groups).length === 0 && (
          <div className="p-8 text-center font-display text-ink-3 italic">
            The list is empty. Nothing to fetch today.
          </div>
        )}

        {Object.entries(groups).map(([group, rows]) => (
          <div key={group} className="mb-6">
            <div className="mb-2 flex justify-between border-b border-dashed border-paper-4 pb-1.5">
              <span className="font-display text-lg text-ink-2 italic">{group}</span>
              <span className="font-mono text-2xs tracking-[0.16em] text-ink-4">
                {rows.length} ITEM{rows.length === 1 ? "" : "S"}
              </span>
            </div>
            {rows.map((it) => (
              <label
                key={it.id}
                className="grid cursor-pointer grid-cols-[24px_1fr_auto] items-center gap-2 border-b border-dotted border-paper-3 py-2 transition-colors last:border-0 hover:bg-paper-1/40 sm:grid-cols-[28px_1fr_auto_auto] sm:gap-3"
              >
                <Checkbox checked={it.done} onChange={() => toggle(it.id)} />
                <div className={cn("min-w-0", it.done && "opacity-50")}>
                  <span
                    className={cn(
                      "block truncate font-display text-md sm:text-lg",
                      it.done && "line-through",
                    )}
                  >
                    {it.name}
                  </span>
                  {it.reason && (
                    <span className="font-mono text-2xs tracking-widest text-ink-4 uppercase">
                      {it.reason}
                    </span>
                  )}
                </div>
                <span
                  className={cn(
                    "num font-mono text-sm whitespace-nowrap",
                    it.done && "line-through opacity-50",
                  )}
                >
                  {formatCount(it.quantity)} {it.unit}
                  <span className="ml-2 text-ink-3 sm:hidden">
                    {it.estPrice ? `· $${it.estPrice.toFixed(2)}` : ""}
                  </span>
                </span>
                <span
                  className={cn(
                    "num hidden w-15 text-right font-mono text-sm text-ink-3 sm:inline",
                    it.done && "line-through opacity-50",
                  )}
                >
                  {it.estPrice ? `$${it.estPrice.toFixed(2)}` : ""}
                </span>
              </label>
            ))}
          </div>
        ))}

        <div className="mt-6 flex items-baseline justify-between border-t-[1.5px] border-ink-1 pt-4">
          <span className="font-mono text-2xs tracking-[0.18em] text-ink-3">
            EST. TOTAL · {outstanding} OUTSTANDING
          </span>
          <span className="num font-display text-3xl">${total.toFixed(2)}</span>
        </div>

        <div className={cn("caption","mt-6 text-center")}>★ THANK YOU FOR FEEDING THE HOUSE ★</div>
      </div>

      <footer className="no-print mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-paper-3 pt-6 md:mt-24">
        <span className="caption">LIST {tripLabel}</span>
        <span className="caption">{(session?.user?.name ?? "—").toUpperCase()}</span>
      </footer>

      <ConfirmDialog
        open={completeOpen}
        onClose={() => setCompleteOpen(false)}
        onConfirm={clearDone}
        title="Trip complete?"
        message={
          <>
            This clears all <strong>{checkedCount}</strong> checked item
            {checkedCount === 1 ? "" : "s"} from the list. Untouched items stay for next time.
          </>
        }
        confirmLabel="Clear checked"
      />
    </>
  );
}
