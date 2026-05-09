import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { RoomGlyph } from "@/icons";
import { AddToShoppingButton } from "@/components/stepper";
import { getDashboardData } from "@/lib/queries";
import { auth } from "@/auth";
import { requireUserId } from "@/lib/access";
import { daysUntil, formatCount, formatDate, formatEventKind } from "@/lib/format";
import { cn } from "@/lib/cn";
import { badge } from "@/components/badge";
import { button } from "@/components/button";
import { level } from "@/components/level";
import { SectionTitle } from "@/components/section-title";
import { ItemThumbnail } from "@/components/item-thumbnail";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const userId = await requireUserId();
  const session = await auth();
  const data = await getDashboardData(userId);

  const today = new Date();
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const months = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
  ];
  const dow = days[today.getDay()].toUpperCase();
  const dd = String(today.getDate()).padStart(2, "0");
  const mon = months[today.getMonth()];
  const yyyy = today.getFullYear();
  const firstName = session?.user?.name?.split(" ")[0] ?? "friend";
  const hour = today.getHours();
  const greeting = hour < 5 ? "Good night" : hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <AppShell>
      <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="caption mb-3">
            {dow} · {dd} {mon} {yyyy}
          </div>
          <h1 className="m-0 mb-2 font-display text-3xl leading-none font-light tracking-display sm:text-4xl lg:text-6xl">
            {greeting},
            <br />
            <em className="font-normal italic">{firstName}.</em>
          </h1>
          <div className="mt-3 font-display text-md font-light text-ink-3 italic sm:text-xl">
            {data.totalItems} items kept across {data.rooms.length} rooms.
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/shopping" className={button({ variant: "secondary" })}>
            Shopping list
          </Link>
          <Link href="/items/new" className={button({ variant: "primary" })}>
            ＋ Add item
          </Link>
        </div>
      </div>

      {(data.lowCount > 0 || data.soonCount > 0) && (
        <div className="mb-8 grid grid-cols-1 items-center gap-6 rounded-xl bg-ink-1 px-5 py-5 text-paper-0 md:mb-12 md:px-8 md:py-6 lg:grid-cols-[1fr_auto]">
          <div>
            <div className="mb-2 font-mono text-2xs tracking-eyebrow-loose text-paper-3 uppercase">
              {String(today.getHours()).padStart(2, "0")}:
              {String(today.getMinutes()).padStart(2, "0")} · ATTENTION
            </div>
            <div className="font-display text-2xl leading-tight font-light tracking-display-md sm:text-3xl">
              {data.lowCount > 0 && (
                <>
                  {data.lowCount} item{data.lowCount === 1 ? "" : "s"} below their floor.
                </>
              )}
              {data.soonCount > 0 && (
                <>
                  <br />
                  <em className="text-tomato-3 italic">{data.soonCount} expiring this week.</em>
                </>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/shopping" className={button({ variant: "olive" })}>
              Build shopping list
            </Link>
            <Link
              href="/search?status=low"
              className={cn(
                button({ variant: "ghost" }),
                "border-paper-3! text-paper-0! hover:bg-paper-0/10!",
              )}
            >
              Review →
            </Link>
          </div>
        </div>
      )}

      <div className="mb-8 grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-paper-3 bg-paper-3 md:mb-12">
        <StatCell n={data.totalItems} label="Items on hand" />
        <StatCell n={data.lowCount} label="Below threshold" tone="text-tomato-2" pad />
        <StatCell n={data.soonCount} label="Expiring ≤ 14 days" tone="text-amber-pantry-2" pad />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
        <div>
          <SectionTitle className="mt-0!">
            <h2>
              Below the <em>floor</em>.
            </h2>
            <Link
              href="/search?status=low"
              className="caption group inline-flex items-center gap-1 border-b border-ink-1 pb-0.5 text-ink-1 transition-colors duration-150 ease-pantry hover:border-olive-2 hover:text-olive-2"
            >
              VIEW ALL {data.lowCount}
              <span
                aria-hidden
                className="inline-block transition-transform duration-200 ease-pantry group-hover:translate-x-0.5"
              >
                →
              </span>
            </Link>
          </SectionTitle>

          <div className="overflow-hidden rounded-xl border border-paper-3 bg-paper-0">
            {data.lowItems.length === 0 && (
              <div className="p-8 text-center font-display text-ink-3 italic">
                Nothing below the floor. The shelf is honest today.
              </div>
            )}
            {data.lowItems.map((it) => {
              const pct = it.threshold
                ? Math.min(100, Math.round((it.count / it.threshold) * 100))
                : 0;
              return (
                <div
                  key={it.id}
                  className="group relative grid grid-cols-[56px_1fr_auto] items-center gap-3 border-b border-dashed border-paper-3 px-4 py-4 transition-[background,transform,box-shadow] duration-150 ease-pantry last:border-0 hover:bg-paper-1 sm:grid-cols-[56px_1fr_auto_auto] sm:gap-4 sm:px-6"
                >
                  <Link
                    href={`/items/${it.id}`}
                    aria-label={it.name}
                    className="absolute inset-0 z-0"
                  />
                  <ItemThumbnail name={it.name} photoUrl={it.photoUrl} className="h-14 w-14" abbrevLength={4} sizes="56px" />
                  <div className="min-w-0">
                    <div className="block truncate font-display text-lg transition-colors group-hover:text-olive-2">
                      {it.name}
                    </div>
                    <div className="caption mt-0.5 truncate">
                      {(it.room?.name ?? "").toUpperCase()}
                      {it.shelf ? ` · ${it.shelf.toUpperCase()}` : ""}
                    </div>
                    <div className="mt-2 sm:hidden">
                      <div className="flex justify-between">
                        <span className="caption num">
                          {formatCount(it.count)} / {formatCount(it.threshold ?? 0)} {it.unit}
                        </span>
                        <span className="caption text-tomato-2">{pct}%</span>
                      </div>
                      <div className={cn(level({ tone: "low" }), "mt-1.5")}>
                        <i style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                  <div className="hidden w-35 sm:block">
                    <div className="flex justify-between">
                      <span className="caption num">
                        {formatCount(it.count)} / {formatCount(it.threshold ?? 0)} {it.unit}
                      </span>
                      <span className="caption text-tomato-2">{pct}%</span>
                    </div>
                    <div className={cn(level({ tone: "low" }), "mt-1.5")}>
                      <i style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <div className="relative z-10 flex items-center gap-2">
                    <span className={badge({ tone: "low" })}>LOW</span>
                    <AddToShoppingButton itemId={it.id} />
                  </div>
                </div>
              );
            })}
          </div>

          <SectionTitle>
            <h2>
              <em>Expiring</em> soon.
            </h2>
            <span className="caption">NEXT 14 DAYS</span>
          </SectionTitle>

          {data.soonItems.length === 0 ? (
            <div className="rounded-xl border border-paper-3 bg-paper-1 p-8 text-center font-display text-ink-3 italic">
              Nothing expiring in the next two weeks.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {data.soonItems.slice(0, 4).map((it) => {
                const days = daysUntil(it.expiresAt);
                return (
                  <Link
                    key={it.id}
                    href={`/items/${it.id}`}
                    className="flex min-h-35 flex-col gap-3 rounded-md border border-paper-3 bg-paper-0 p-4 text-inherit transition-[transform,box-shadow,border-color] duration-200 ease-pantry hover:-translate-y-0.5 hover:border-ink-3 hover:shadow-card-hover"
                  >
                    <span className={badge({ tone: "soon" })}>
                      <i className="w-1.5 h-1.5 rounded-full inline-block bg-amber-pantry" />
                      {days} DAYS
                    </span>
                    <div className="font-display text-xl font-normal">
                      {it.name}
                      <br />
                      <em className="italic">
                        {formatDate(it.expiresAt).split(" ").slice(0, 2).join(" ")}
                      </em>
                    </div>
                    <div className="caption">
                      {(it.room?.name ?? "").toUpperCase()}
                      {it.shelf ? ` · ${it.shelf.toUpperCase()}` : ""}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <SectionTitle className="mt-0!">
            <h2>
              <em>Activity</em>.
            </h2>
            <span className="caption">LAST EVENTS</span>
          </SectionTitle>
          <div className="rounded-xl border border-paper-3 bg-paper-1 p-4 md:p-6">
            {data.recentEvents.length === 0 && (
              <div className="caption py-3 text-center">
                Nothing yet — start adding items.
              </div>
            )}
            {data.recentEvents.map((ev) => {
              const row = (
                <>
                  <span className="font-mono text-2xs tracking-widest text-ink-4">
                    {formatDate(ev.createdAt, { dotted: true })}
                  </span>
                  <span className="min-w-0">
                    {ev.itemName ? (
                      <span className="block truncate font-display text-base text-ink-1 transition-colors group-hover:text-olive-2">
                        {ev.itemName}
                      </span>
                    ) : (
                      <span className="block truncate font-display text-base text-ink-3 italic">
                        — deleted item —
                      </span>
                    )}
                    <span className="caption mt-0.5 block truncate">
                      {ev.roomName ? `${ev.roomName.toUpperCase()} · ` : ""}
                      {formatEventKind(ev.kind).toUpperCase()}
                      {ev.note ? ` · ${ev.note}` : ""}
                    </span>
                  </span>
                  <span className="num text-right font-mono text-sm">
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
                "group grid grid-cols-[56px_1fr_auto] items-start gap-3 border-b border-dashed border-paper-3 py-3 transition-colors duration-150 ease-pantry last:border-0";
              return ev.itemId && ev.itemName ? (
                <Link
                  key={ev.id}
                  href={`/items/${ev.itemId}`}
                  className={cn(className, "-mx-4 px-4 hover:bg-paper-2 md:-mx-6 md:px-6")}
                >
                  {row}
                </Link>
              ) : (
                <div key={ev.id} className={className}>
                  {row}
                </div>
              );
            })}
          </div>

          <SectionTitle>
            <h2>
              Rooms <em>at a glance</em>.
            </h2>
            <Link
              href="/rooms"
              className="caption group inline-flex items-center gap-1 border-b border-ink-1 pb-0.5 text-ink-1 transition-colors duration-150 ease-pantry hover:border-olive-2 hover:text-olive-2"
            >
              ALL ROOMS
              <span
                aria-hidden
                className="inline-block transition-transform duration-200 ease-pantry group-hover:translate-x-0.5"
              >
                →
              </span>
            </Link>
          </SectionTitle>
          <div className="flex flex-col gap-2">
            {data.rooms.map((r) => {
              const low = data.lowItems.filter((i) => i.roomId === r.id).length;
              return (
                <Link
                  key={r.id}
                  href={`/rooms/${r.id}`}
                  className="flex items-center justify-between rounded-md border border-paper-3 bg-paper-0 px-4 py-3 transition-[background,transform,box-shadow] duration-150 ease-pantry hover:bg-paper-1"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-ink-2">
                      <RoomGlyph name={r.glyph} size={16} />
                    </span>
                    <span className="font-display text-lg">{r.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {low > 0 ? (
                      <span className={badge({ tone: "low" })}>{low} LOW</span>
                    ) : (
                      <span className="caption text-olive-2">OK</span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <footer className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-paper-3 pt-6 md:mt-24">
        <span className="caption">PANTRY · LEDGER</span>
        <span className="caption">{(session?.user?.name ?? "—").toUpperCase()}</span>
      </footer>
    </AppShell>
  );
}

function StatCell({
  n,
  label,
  tone,
  pad,
}: {
  n: number;
  label: string;
  tone?: string;
  pad?: boolean;
}) {
  const display = pad ? String(n).padStart(2, "0") : String(n);
  return (
    <div className="bg-paper-0 px-4 py-4 md:px-6 md:py-6">
      <div className={cn("font-display text-2xl leading-none font-normal md:text-3xl", tone)}>
        {display}
      </div>
      <div className="caption mt-2 text-3xs md:mt-3 md:text-xs">{label}</div>
    </div>
  );
}
