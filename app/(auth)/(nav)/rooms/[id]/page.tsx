import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { auth } from "@/auth";
import { canViewRoom, getRoleInRoom, requireUserId } from "@/lib/access";
import { RoomViews } from "./room-views";
import { RoomDetailHeader } from "./room-detail-header";
import { RoomMembersPanel } from "./room-members-panel";
import { getItemsForRoom, getRoom, getRoomsWithCounts } from "@/lib/queries";
import { itemStatus, formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";
import { level } from "@/components/level";

export const dynamic = "force-dynamic";

export default async function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  const session = await auth();
  const { id } = await params;
  const room = await getRoom(id);
  if (!room) {
    notFound();
  }
  if (!(await canViewRoom(userId, id))) {
    notFound();
  }
  const role = await getRoleInRoom(userId, id);
  const isOwner = role === "owner";
  const isArchived = room.archivedAt !== null;

  const items = await getItemsForRoom(id);
  const enriched = items.map((i) => ({
    ...i,
    status: itemStatus({ count: i.count, threshold: i.threshold, expiresAt: i.expiresAt }),
    upd: formatDate(i.updatedAt, { dotted: true }),
  }));

  const allRooms = await getRoomsWithCounts(userId);
  const ix = allRooms.findIndex((r) => r.id === id);
  const idx = String(ix + 1).padStart(2, "0");
  const total = String(allRooms.length).padStart(2, "0");

  const lowCount = enriched.filter((i) => i.status === "low").length;
  const soonCount = enriched.filter((i) => i.status === "soon").length;

  const categories = Array.from(new Set(items.map((i) => i.category).filter(Boolean))) as string[];
  const catCounts = categories.map((c) => ({
    name: c,
    count: items.filter((i) => i.category === c).length,
  }));

  return (
    <AppShell>
      <nav className="mb-3 flex flex-wrap items-center gap-2 text-xs text-ink-3">
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
        <span className="text-ink-1">{room.name}</span>
      </nav>

      <RoomDetailHeader
        room={room}
        idx={idx}
        total={total}
        itemCount={items.length}
        role={role ?? "viewer"}
        archived={isArchived}
      />

      <div className="mb-8 grid grid-cols-1 gap-8 rounded-xl border border-paper-3 bg-paper-1 p-5 md:p-8 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <div className={cn("caption","mb-3")}>AT A GLANCE</div>
          <div className="mb-6 flex flex-wrap items-center gap-6 md:gap-12">
            <Stat n={String(items.length).padStart(2, "0")} label="ITEMS" />
            <Divider />
            <Stat n={String(lowCount).padStart(2, "0")} label="LOW" color="text-tomato-2" />
            <Divider />
            <Stat
              n={String(soonCount).padStart(2, "0")}
              label="EXPIRING"
              color="text-amber-pantry-2"
            />
          </div>
        </div>
        <div>
          <div className={cn("caption","mb-3")}>BY CATEGORY</div>
          <div className="grid gap-3">
            {catCounts.length === 0 && (
              <div className="font-display text-md text-ink-3 italic">Nothing categorized yet.</div>
            )}
            {catCounts.map((c, i) => {
              const max = Math.max(...catCounts.map((x) => x.count), 1);
              const pct = Math.round((c.count / max) * 100);
              const colors = ["bg-olive", "bg-amber-pantry", "bg-plum", "bg-tomato"];
              return (
                <div
                  key={c.name}
                  className="grid grid-cols-[80px_1fr_40px] items-center gap-3 sm:grid-cols-[100px_1fr_60px]"
                >
                  <span className="truncate font-mono text-2xs tracking-[0.12em] text-ink-3 uppercase">
                    {c.name}
                  </span>
                  <div className={level()}>
                    <i style={{ width: `${pct}%` }} className={colors[i % colors.length]} />
                  </div>
                  <span className="num text-right font-mono text-xs text-ink-2">
                    {c.count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <RoomViews items={enriched} />

      {isOwner && <RoomMembersPanel roomId={id} roomName={room.name} />}

      <footer className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-paper-3 pt-6 md:mt-24">
        <span className="caption">
          {room.name.toUpperCase()} · ROOM {idx} · {items.length} ITEMS
        </span>
        <span className="caption">PANTRY · {(session?.user?.name ?? "—").toUpperCase()}</span>
      </footer>
    </AppShell>
  );
}

function Stat({ n, label, color }: { n: string; label: string; color?: string }) {
  return (
    <div>
      <div className={cn("num font-display text-3xl leading-none font-light sm:text-5xl", color)}>
        {n}
      </div>
      <div className={cn("caption","mt-1")}>{label}</div>
    </div>
  );
}

function Divider() {
  return <div className="h-10 w-px bg-paper-3 sm:h-15" />;
}
