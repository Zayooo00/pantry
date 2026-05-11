import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getRoomWithRole } from "@/lib/access";
import { Stepper, AddToShoppingButton } from "@/components/stepper";
import { ItemActions, MarkOpenedButton } from "./item-actions";
import { getItem, getItemEvents, getRoomsWithCounts } from "@/lib/queries";
import { formatCount, formatDate, formatEventKind, itemStatus, shortLabel } from "@/lib/format";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/badge";
import { Stamp } from "@/components/stamp";
import { SectionTitle } from "@/components/section-title";

export const dynamic = "force-dynamic";

export default async function ItemPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }
  const userId = session.user.id;
  const { id } = await params;

  const item = await getItem(id);
  if (!item) {
    notFound();
  }
  const access = await getRoomWithRole(userId, item.roomId);
  if (!access) {
    notFound();
  }
  const { room, role } = access;
  const canEdit = role === "owner" || role === "editor";
  const [events, allRooms] = await Promise.all([
    getItemEvents(item.id),
    getRoomsWithCounts(userId),
  ]);

  const status = itemStatus({
    count: item.count,
    threshold: item.threshold,
    expiresAt: item.expiresAt,
  });
  const isLow = status === "low";

  const tags = (item.tags ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  return (
    <>
      <nav className="mb-6 flex flex-wrap items-center gap-2 text-xs text-ink-3">
        <Link
          href="/dashboard"
          className="border-b border-dotted border-ink-3 transition-colors hover:border-ink-1 hover:text-ink-1"
        >
          Home
        </Link>
        <span>/</span>
        <Link
          href="/rooms"
          className="border-b border-dotted border-ink-3 transition-colors hover:border-ink-1 hover:text-ink-1"
        >
          Rooms
        </Link>
        <span>/</span>
        <Link
          href={`/rooms/${room.id}`}
          className="border-b border-dotted border-ink-3 transition-colors hover:border-ink-1 hover:text-ink-1"
        >
          {room.name}
        </Link>
        <span>/</span>
        <span className="text-ink-1">{item.name}</span>
      </nav>

      <div className="mb-8 grid grid-cols-1 gap-8 md:mb-12 md:gap-12 lg:grid-cols-[420px_1fr]">
        <div>
          <div className="relative aspect-4/5 overflow-hidden rounded-xl border border-paper-3">
            {item.photoUrl ? (
              <Image
                src={item.photoUrl}
                alt={item.name}
                fill
                sizes="(min-width: 1024px) 420px, 100vw"
                priority
                className="object-cover"
                unoptimized={item.photoUrl.startsWith("/api/photos/")}
              />
            ) : (
              <div
                className="relative grid h-full w-full place-items-center overflow-hidden rounded-none! border-0! border-paper-3 bg-[repeating-linear-gradient(45deg,var(--color-paper-2)_0_6px,var(--color-paper-1)_6px_12px)] font-mono text-sm tracking-widest text-ink-4 uppercase"
                style={{
                  background: "repeating-linear-gradient(45deg, #d8d0b8 0 14px, #ccc4ac 14px 28px)",
                }}
              >
                {shortLabel(item.name, 12)}
              </div>
            )}
            {isLow && (
              <div className="absolute top-4 left-4">
                <Stamp tone="tomato">RESTOCK</Stamp>
              </div>
            )}
            {item.barcode && (
              <div className="absolute right-4 bottom-4 flex items-center gap-2 rounded-sm border border-ink-1 bg-paper-0 px-2.5 py-1.5">
                <span
                  aria-hidden
                  className="font-mono text-base leading-none tracking-[0.35em] text-ink-1"
                >
                  ║║║▌║║
                </span>
                <span className="font-mono text-2xs tracking-label text-ink-2">{item.barcode}</span>
              </div>
            )}
          </div>
          <div className={cn("caption", "mt-6")}>
            CREATED {formatDate(item.createdAt, { dotted: true })}
            {item.openedAt && ` · OPENED ${formatDate(item.openedAt, { dotted: true })}`}
          </div>
        </div>

        <div>
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-paper-3 pb-6 md:gap-6">
            <div>
              <div className={cn("caption", "mb-3")}>
                {(item.category ?? "").toUpperCase()}
                {` · ${room.name.toUpperCase()}`}
                {item.shelf ? ` / ${item.shelf.toUpperCase()}` : ""}
              </div>
              <h1 className="m-0 font-display text-3xl leading-[0.95] font-light tracking-display sm:text-4xl lg:text-6xl">
                {item.name.split(" ").slice(0, -1).join(" ") || item.name}
                {item.name.split(" ").length > 1 && (
                  <>
                    <br />
                    <em className="italic">{item.name.split(" ").slice(-1)[0]}</em>.
                  </>
                )}
              </h1>
              {tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-3">
                  {tags.map((t) => (
                    <Badge key={t} tone="tag">
                      {t.toUpperCase()}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            {canEdit && (
              <ItemActions item={item} rooms={allRooms.map((r) => ({ id: r.id, name: r.name }))} />
            )}
          </div>

          <div
            className={cn(
              "mb-6 grid grid-cols-1 items-center gap-6 rounded-xl border p-5 md:grid-cols-[auto_1fr] md:gap-12 md:p-8",
              isLow ? "border-tomato-2 bg-tomato-3" : "border-olive-2 bg-olive-3",
            )}
          >
            <div>
              <div className="mb-1 font-mono text-2xs tracking-eyebrow-loose text-ink-2 uppercase">
                CURRENTLY ON HAND
              </div>
              <div
                className={cn(
                  "num font-display text-6xl leading-none font-light md:text-[96px]",
                  isLow ? "text-tomato-2" : "text-olive-2",
                )}
              >
                {formatCount(item.count)} <em className="italic">{item.unit}</em>
              </div>
              <div className="mt-2 font-display text-xl text-ink-1">
                {isLow && item.threshold ? (
                  <>
                    Below the floor of{" "}
                    <em className="italic">
                      {formatCount(item.threshold)} {item.unit}
                    </em>
                    .
                  </>
                ) : item.threshold ? (
                  <>
                    The shelf is honest. Floor at{" "}
                    <em className="italic">
                      {formatCount(item.threshold)} {item.unit}
                    </em>
                    .
                  </>
                ) : (
                  <>The shelf is honest.</>
                )}
              </div>
            </div>
            {canEdit && (
              <div className="flex flex-col gap-3 md:items-end">
                <Stepper
                  itemId={item.id}
                  initialCount={item.count}
                  step={item.unit === "L" || item.unit === "kg" ? 0.1 : 1}
                  size="xl"
                />
                <div className="flex flex-wrap gap-2 md:justify-end">
                  <MarkOpenedButton
                    itemId={item.id}
                    itemName={item.name}
                    alreadyOpened={!!item.openedAt}
                  />
                  <AddToShoppingButton itemId={item.id} label="＋ Shopping list" />
                </div>
              </div>
            )}
          </div>

          <div className="mb-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-paper-3 bg-paper-3">
            <Fact label="UNIT" value={item.unit} />
            <Fact
              label="LOW-STOCK FLOOR"
              value={item.threshold ? `${formatCount(item.threshold)} ${item.unit}` : "—"}
            />
            <Fact label="LOCATION" value={room.name} sub={item.shelf ?? undefined} />
            <Fact label="CATEGORY" value={item.category ?? "—"} />
            <Fact label="EXPIRES" value={item.expiresAt ? formatDate(item.expiresAt) : "—"} />
            <Fact label="OPENED" value={item.openedAt ? formatDate(item.openedAt) : "—"} />
            <Fact label="BARCODE" value={item.barcode ?? "—"} mono />
            <Fact
              label="LAST PRICE"
              value={item.lastPrice ? `$${item.lastPrice.toFixed(2)}` : "—"}
            />
          </div>

          {item.notes && (
            <div className="mb-6 rounded-lg border border-paper-3 bg-paper-1 p-6">
              <div className={cn("caption", "mb-2")}>NOTES</div>
              <p className="m-0 font-display text-lg leading-relaxed text-ink-2">{item.notes}</p>
            </div>
          )}
        </div>
      </div>

      <SectionTitle>
        <h2>
          <em>History</em>.
        </h2>
        <span className="caption">
          {events.length} EVENT{events.length === 1 ? "" : "S"}
        </span>
      </SectionTitle>
      <div className="rounded-xl border border-paper-3 bg-paper-1 p-4 md:p-6">
        {events.length === 0 ? (
          <div className="caption py-3 text-center">No events yet.</div>
        ) : (
          events.map((e) => (
            <div
              key={e.id}
              className="-mx-2 grid grid-cols-[90px_1fr_60px] items-center gap-3 rounded border-b border-dashed border-paper-3 px-2 py-3 text-sm transition-[background,transform,box-shadow] duration-150 ease-pantry last:border-0 hover:bg-paper-1 sm:grid-cols-[120px_1fr_80px_80px] sm:gap-4"
            >
              <span className="font-mono text-2xs tracking-widest text-ink-4">
                {formatDate(e.createdAt, { dotted: true })}
              </span>
              <span className="min-w-0 truncate">
                <em className="font-display italic">{formatEventKind(e.kind)}</em>
                {e.note ? ` — ${e.note}` : ""}
              </span>
              <span className="num text-right font-mono sm:text-left">
                {e.delta != null ? (
                  <span className={e.delta > 0 ? "text-olive-2" : "text-tomato-2"}>
                    {e.delta > 0 ? "+" : ""}
                    {formatCount(e.delta)}
                  </span>
                ) : (
                  "—"
                )}
              </span>
              <span className="caption hidden sm:inline">{e.actor ?? "—"}</span>
            </div>
          ))
        )}
      </div>

      <footer className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-paper-3 pt-6 md:mt-24">
        <span className="caption">
          CREATED {formatDate(item.createdAt, { dotted: true })} · MODIFIED{" "}
          {formatDate(item.updatedAt, { dotted: true })}
        </span>
        <span className="caption">{(session?.user?.name ?? "—").toUpperCase()}</span>
      </footer>
    </>
  );
}

function Fact({
  label,
  value,
  sub,
  mono,
}: {
  label: string;
  value: string;
  sub?: string;
  mono?: boolean;
}) {
  return (
    <div className="bg-paper-0 px-6 py-4">
      <div className={cn("caption", "mb-1")}>{label}</div>
      <div className={mono ? "font-mono text-sm" : "font-display text-lg"}>
        {value}
        {sub && <em className="text-ink-3 italic"> {sub}</em>}
      </div>
    </div>
  );
}
