"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { mutate as globalMutate } from "swr";
import { useRouter } from "next/navigation";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { sumBy } from "lodash-es";
import { Modal } from "@/components/modal";
import { NewRoomForm } from "@/components/new-room-form";
import { RoomGlyph } from "@/icons";
import { RoomRowActions } from "./rooms-actions";
import { useToast } from "@/components/toast";
import { cn } from "@/lib/cn";
import { badge } from "@/components/badge";
import { button } from "@/components/button";
import { roleBadge } from "@/components/role-badge";
import { useMutation } from "@/lib/api/client";
import type { Room as RoomRow } from "@/db/schema";

type Room = Pick<RoomRow, "id" | "name" | "glyph" | "subtitle" | "tinted"> & {
  count: number;
  low: number;
  role: "owner" | "editor" | "viewer";
  archived: boolean;
};

type TabKey = "all" | "indoor" | "cold" | "longterm" | "archived";

const tabs: { key: TabKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "indoor", label: "Indoor" },
  { key: "cold", label: "Cold storage" },
  { key: "longterm", label: "Long-term" },
  { key: "archived", label: "Archived" },
];

const glyphCategory: Record<string, "indoor" | "cold" | "longterm"> = {
  pantry: "indoor",
  kitchen: "indoor",
  spice: "indoor",
  fridge: "cold",
  freezer: "cold",
  basement: "longterm",
  garage: "longterm",
};

function filterRooms(rooms: Room[], tab: TabKey): Room[] {
  if (tab === "archived") {
    return rooms.filter((r) => r.archived);
  }
  const live = rooms.filter((r) => !r.archived);
  if (tab === "all") {
    return live;
  }
  return live.filter((r) => glyphCategory[r.glyph] === tab);
}

const palettes: Record<string, string[]> = {
  pantry: ["#5a6b3a", "#c4892a", "#5d3a52", "#b8412b"],
  basement: ["#5a6b3a", "#5d3a52", "#c4892a"],
  kitchen: ["#b8412b", "#5a6b3a", "#c4892a", "#5d3a52"],
  fridge: ["#5a6b3a", "#c4892a", "#b8412b"],
  freezer: ["#5a6b3a", "#c4892a"],
  spice: ["#c4892a", "#5d3a52", "#b8412b"],
  garage: ["#5a6b3a", "#5d3a52"],
};

export function RoomsPageClient({ initialRooms }: { initialRooms: Room[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [rooms, setRooms] = useState(initialRooms);
  const [reordering, setReordering] = useState(false);
  const [newRoomOpen, setNewRoomOpen] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("all");

  const effectiveTab: TabKey = reordering ? "all" : activeTab;
  const visibleRooms = useMemo(() => filterRooms(rooms, effectiveTab), [rooms, effectiveTab]);

  const total = sumBy(visibleRooms, "count");
  const totalLow = sumBy(visibleRooms, "low");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }
    setRooms((current) => {
      const oldIndex = current.findIndex((r) => r.id === active.id);
      const newIndex = current.findIndex((r) => r.id === over.id);
      if (oldIndex === -1 || newIndex === -1) {
        return current;
      }
      return arrayMove(current, oldIndex, newIndex);
    });
  }

  const { trigger: triggerReorder } = useMutation("post", "/api/rooms/reorder");

  async function saveOrder() {
    setSavingOrder(true);
    try {
      await triggerReorder({ body: { order: rooms.map((r) => r.id) } });
    } finally {
      setSavingOrder(false);
    }
    setReordering(false);
    globalMutate(["pantry", "/api/sidebar"]);
    toast(<>Order <em>saved</em>.</>);
    router.refresh();
  }

  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-6 md:mb-12">
        <div>
          <div className="caption">
            {visibleRooms.length} ROOMS · {total} ITEMS
          </div>
          <h1 className="m-0 mt-2 font-display text-3xl leading-none font-light tracking-[-0.03em] sm:text-4xl lg:text-6xl">
            Where things <em className="font-normal italic">live</em>.
          </h1>
          <div className="mt-3 font-display text-md font-light text-ink-3 italic sm:text-xl">
            A house, in {visibleRooms.length} cupboards.
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          {reordering ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setRooms(initialRooms);
                  setReordering(false);
                }}
                className={button({ variant: "ghost" })}
                disabled={savingOrder}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveOrder}
                className={button({ variant: "primary" })}
                disabled={savingOrder}
              >
                {savingOrder ? "Saving…" : "Save order"}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setReordering(true)}
                className={button({ variant: "secondary" })}
              >
                Reorder
              </button>
              <button type="button" onClick={() => setNewRoomOpen(true)} className={button({ variant: "primary" })}>
                ＋ New room
              </button>
            </>
          )}
        </div>
      </div>

      {!reordering && (
        <div
          role="tablist"
          aria-label="Filter rooms"
          className="-mx-4 mb-6 flex items-center gap-1 overflow-x-auto border-b border-paper-3 px-4 md:mx-0 md:mb-8 md:px-0"
        >
          {tabs.map((t) => {
            const isActive = activeTab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(t.key)}
                className={cn(
                  "-mb-px shrink-0 border-b-2 px-3 py-2 font-display text-md whitespace-nowrap transition-colors md:px-4 md:text-lg",
                  isActive
                    ? "border-ink-1 text-ink-0"
                    : "border-transparent text-ink-3 hover:text-ink-1",
                )}
              >
                {isActive ? (
                  <em className="font-normal italic">{t.label}</em>
                ) : (
                  <span className="font-light">{t.label}</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {reordering && (
        <div className="mb-6 rounded-md border border-ink-1 bg-paper-1 px-4 py-3 font-display text-sm text-ink-2 italic">
          Reorder mode — drag tiles to rearrange. Save when you're happy.
        </div>
      )}

      {visibleRooms.length === 0 && !reordering ? (
        <div className="rounded-xl border border-dashed border-paper-4 py-16 text-center">
          <div className="font-display text-2xl font-light text-ink-3 italic">
            Nothing <em>here</em> yet.
          </div>
          <div className={cn("caption","mt-2")}>NO ROOMS IN THIS CATEGORY</div>
        </div>
      ) : reordering ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={rooms.map((r) => r.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {rooms.map((r, i) => (
                <SortableRoomTile key={r.id} room={r} index={i} total={rooms.length} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {visibleRooms.map((r, i) => (
            <RoomTileLink key={r.id} room={r} index={i} total={visibleRooms.length} />
          ))}
          <button
            type="button"
            onClick={() => setNewRoomOpen(true)}
            className="grid min-h-70 cursor-pointer place-items-center rounded-xl border-[1.5px] border-dashed border-paper-4 bg-transparent text-ink-3 transition-all hover:border-ink-1 hover:bg-paper-1 hover:text-ink-0"
          >
            <div className="text-center">
              <div className="text-4xl leading-none font-extralight">＋</div>
              <div className="mt-2 font-display text-2xl font-light italic">a new room</div>
              <div className={cn("caption","mt-2")}>CUPBOARD · CELLAR · SHELF</div>
            </div>
          </button>
        </div>
      )}

      <footer className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-paper-3 pt-6 md:mt-24">
        <span className="caption">
          {visibleRooms.length} ROOMS · {total} ITEMS · {totalLow} LOW
        </span>
        <span className="caption">EST. ONE KITCHEN</span>
      </footer>

      <Modal
        open={newRoomOpen}
        onClose={() => setNewRoomOpen(false)}
        title={
          <>
            New <em>room</em>
          </>
        }
      >
        <NewRoomForm onClose={() => setNewRoomOpen(false)} />
      </Modal>
    </>
  );
}

function tileClasses(tinted: boolean) {
  return cn(
    "group relative flex min-h-70 flex-col gap-3 rounded-xl border p-6 transition-[transform,box-shadow,border-color] duration-200 ease-pantry hover:-translate-y-0.5 hover:border-ink-3 hover:shadow-[0_12px_28px_rgba(26,24,20,0.08),0_1px_0_rgba(26,24,20,0.04)]",
    tinted ? "border-paper-3 bg-olive-3" : "border-paper-3 bg-paper-0",
  );
}

function RoomTileInner({
  room,
  index,
  total,
  showActions,
}: {
  room: Room;
  index: number;
  total: number;
  showActions: boolean;
}) {
  const palette = palettes[room.glyph] ?? ["#5a6b3a"];
  const idx = String(index + 1).padStart(2, "0");
  const totalIdx = String(total).padStart(2, "0");
  const tinted = room.tinted;
  const textTintCls = tinted ? "text-olive-2" : "text-ink-2";
  const subTintCls = tinted ? "text-olive-2" : "text-ink-3";

  return (
    <>
      <div className={cn("flex items-center justify-between", textTintCls)}>
        <div className="flex items-center gap-2">
          <RoomGlyph name={room.glyph} size={28} />
          {room.role !== "owner" && (
            <span className={roleBadge({ role: room.role })} title={`Shared · ${room.role}`}>
              {room.role === "editor" ? "SHARED · EDIT" : "SHARED · VIEW"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {showActions && room.role === "owner" && (
            <RoomRowActions
              room={{ ...room, itemCount: room.count, archived: room.archived }}
            />
          )}
          {room.archived && (
            <span
              className="rounded-full border border-paper-3 bg-paper-1 px-2 py-0.5 font-mono text-3xs tracking-[0.18em] uppercase text-ink-3"
              title="Archived"
            >
              ARCHIVED
            </span>
          )}
          <span
            className={cn(
              "font-mono text-2xs tracking-[0.18em]",
              tinted ? "text-olive-2" : "text-ink-4",
            )}
          >
            {idx} / {totalIdx}
          </span>
        </div>
      </div>
      <div className={cn("caption","mt-3", tinted && "text-olive-2")}>{room.subtitle ?? ""}</div>
      <div
        className={cn(
          "mt-auto font-display text-5xl leading-none font-light tracking-[-0.02em]",
          tinted && "text-olive-2",
        )}
      >
        {room.name.split(" ")[0]}
        {room.name.split(" ")[1] && (
          <em className="font-normal italic">
            {" "}
            {room.name.split(" ").slice(1).join(" ").toLowerCase()}
          </em>
        )}
      </div>
      <div className="mt-3 flex h-1 gap-0.5 overflow-hidden rounded-full bg-paper-2">
        {palette.map((c, j) => (
          <i key={j} className="block h-full flex-1" style={{ background: c }} />
        ))}
      </div>
      <div className="mt-3 flex items-baseline justify-between border-t border-dashed border-paper-3 pt-3">
        <span className={cn("font-mono text-xs tabular-nums", subTintCls)}>{room.count} ITEMS</span>
        {room.low > 0 ? (
          <span className={badge({ tone: "low" })}>{room.low} LOW</span>
        ) : (
          <span className={cn("caption","text-olive-2")}>ALL OK</span>
        )}
      </div>
    </>
  );
}

function RoomTileLink({ room, index, total }: { room: Room; index: number; total: number }) {
  return (
    <div className={tileClasses(room.tinted)}>
      <Link
        href={`/rooms/${room.id}`}
        aria-label={room.name}
        className="absolute inset-0 z-0 rounded-xl"
      />
      <RoomTileInner room={room} index={index} total={total} showActions />
    </div>
  );
}

function SortableRoomTile({ room, index, total }: { room: Room; index: number; total: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: room.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        tileClasses(room.tinted),
        "cursor-grab touch-none select-none active:cursor-grabbing",
        isDragging && "z-10 opacity-60 shadow-lg",
      )}
    >
      <RoomTileInner room={room} index={index} total={total} showActions={false} />
      <div
        aria-hidden
        className={cn(
          "absolute top-3 right-3 rounded px-1.5 py-1 font-mono text-2xs leading-none tracking-[0.18em]",
          room.tinted ? "text-olive-2" : "text-ink-4",
        )}
        title="Drag to reorder"
      >
        ⋮⋮
      </div>
    </div>
  );
}
