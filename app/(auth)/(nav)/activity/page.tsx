import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { requireUserId } from "@/lib/access";
import { getRecentEvents } from "@/lib/queries";
import { formatCount, formatDate, formatEventKind } from "@/lib/format";
import { cn } from "@/lib/cn";

export const dynamic = "force-dynamic";

export default async function ActivityPage() {
  const userId = await requireUserId();
  const events = await getRecentEvents(userId, 200);

  return (
    <AppShell>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-6 md:mb-12">
        <div>
          <div className={cn("caption","mb-3")}>PANTRY · LEDGER</div>
          <h1 className="m-0 mb-2 font-display text-3xl leading-none font-light tracking-[-0.03em] sm:text-4xl lg:text-6xl">
            <em className="font-normal italic">Activity</em>.
          </h1>
          <div className="mt-3 font-display text-md font-light text-ink-3 italic sm:text-xl">
            {events.length === 0
              ? "Nothing has happened yet."
              : `${events.length} most recent event${events.length === 1 ? "" : "s"}.`}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-paper-3 bg-paper-1">
        {events.length === 0 ? (
          <div className="p-8 text-center font-display text-ink-3 italic">No events recorded.</div>
        ) : (
          events.map((ev) => {
            const row = (
              <>
                <span className="font-mono text-2xs tracking-widest text-ink-4">
                  {formatDate(ev.createdAt, { dotted: true })}
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

      <footer className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-paper-3 pt-6 md:mt-24">
        <span className="caption">PANTRY · LEDGER</span>
        <span className="caption">
          {events.length} EVENT{events.length === 1 ? "" : "S"}
        </span>
      </footer>
    </AppShell>
  );
}
