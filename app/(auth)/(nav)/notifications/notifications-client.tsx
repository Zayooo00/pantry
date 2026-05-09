"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { mutate as globalMutate } from "swr";
import { useToast } from "@/components/toast";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { button } from "@/components/button";
import { chip } from "@/components/chip";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";

type N = {
  id: string;
  userId: string;
  kind: string;
  title: string;
  body: string | null;
  link: string | null;
  itemId: string | null;
  roomId: string | null;
  readAt: string | null;
  createdAt: string;
};

const KIND_LABEL: Record<string, string> = {
  low_threshold_crossed: "LOW STOCK",
  invite_accepted: "INVITE",
  invite_received: "INVITE",
};

export function NotificationsClient({ initial }: { initial: N[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [items, setItems] = useState<N[]>(initial);
  const [view, setView] = useState<"unread" | "all">("unread");
  const [clearOpen, setClearOpen] = useState(false);

  const unreadCount = items.filter((i) => !i.readAt).length;
  const visible = view === "unread" ? items.filter((i) => !i.readAt) : items;

  function refreshBadge() {
    globalMutate(["pantry", "/api/notifications/unread-count"]);
  }

  async function markRead(id: string) {
    const target = items.find((i) => i.id === id);
    if (!target || target.readAt) {
      return;
    }
    setItems((current) =>
      current.map((i) => (i.id === id ? { ...i, readAt: new Date().toISOString() } : i)),
    );
    try {
      await fetch(`/api/notifications/${id}`, { method: "PATCH" });
      refreshBadge();
    } catch {
      // best-effort
    }
  }

  async function readAll() {
    if (unreadCount === 0) {
      return;
    }
    setItems((current) =>
      current.map((i) => (i.readAt ? i : { ...i, readAt: new Date().toISOString() })),
    );
    try {
      await fetch("/api/notifications/read-all", { method: "POST" });
      refreshBadge();
      toast(<>All caught up.</>);
    } catch {
      toast(<>Couldn't mark all read.</>);
    }
    router.refresh();
  }

  async function clearRead() {
    const readIds = items.filter((i) => i.readAt).map((i) => i.id);
    if (readIds.length === 0) {
      setClearOpen(false);
      return;
    }
    setItems((current) => current.filter((i) => !i.readAt));
    setClearOpen(false);
    try {
      await Promise.all(
        readIds.map((id) => fetch(`/api/notifications/${id}`, { method: "DELETE" })),
      );
      refreshBadge();
      toast(<>Cleared {readIds.length} read notification{readIds.length === 1 ? "" : "s"}.</>);
    } catch {
      toast(<>Couldn't clear.</>);
    }
    router.refresh();
  }

  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-6 md:mb-12">
        <div>
          <div className={cn("caption", "mb-3")}>PANTRY · INBOX</div>
          <h1 className="m-0 mb-2 font-display text-3xl leading-none font-light tracking-[-0.03em] sm:text-4xl lg:text-6xl">
            <em className="font-normal italic">Notifications</em>.
          </h1>
          <div className="mt-3 font-display text-md font-light text-ink-3 italic sm:text-xl">
            {items.length === 0
              ? "Nothing in the inbox."
              : unreadCount === 0
                ? "All read. The shelf is calm."
                : `${unreadCount} unread of ${items.length} total.`}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={readAll}
            disabled={unreadCount === 0}
            className={button({ variant: "ghost" })}
          >
            Mark all read
          </button>
          <button
            type="button"
            onClick={() => setClearOpen(true)}
            disabled={items.every((i) => !i.readAt)}
            className={button({ variant: "ghost" })}
          >
            Clear read
          </button>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setView("unread")}
          className={chip({ active: view === "unread" })}
        >
          Unread ({unreadCount})
        </button>
        <button
          type="button"
          onClick={() => setView("all")}
          className={chip({ active: view === "all" })}
        >
          All ({items.length})
        </button>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-xl border border-paper-3 bg-paper-1 p-16 text-center font-display text-ink-3 italic">
          {view === "unread"
            ? "No unread notifications."
            : "No notifications recorded."}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-paper-3 bg-paper-0">
          {visible.map((n) => {
            const unread = !n.readAt;
            const Inner = (
              <>
                <div className="flex items-baseline gap-2 mb-1">
                  {unread && (
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-tomato" aria-hidden />
                  )}
                  <span className="caption">
                    {KIND_LABEL[n.kind] ?? n.kind.replace(/_/g, " ").toUpperCase()}
                  </span>
                  <span className="font-mono text-2xs tracking-[0.16em] text-ink-4">
                    {formatDate(new Date(n.createdAt), { dotted: true })}
                  </span>
                </div>
                <div
                  className={cn(
                    "font-display text-base sm:text-lg",
                    unread ? "text-ink-1" : "text-ink-3",
                  )}
                >
                  {n.title}
                </div>
                {n.body && (
                  <div className={cn("mt-1 text-sm", unread ? "text-ink-2" : "text-ink-4")}>
                    {n.body}
                  </div>
                )}
              </>
            );
            const baseClass = cn(
              "block border-b border-dashed border-paper-3 px-4 py-4 text-inherit transition-colors duration-150 ease-pantry last:border-0 sm:px-6",
              unread ? "bg-paper-1" : "bg-paper-0",
              n.link && "hover:bg-paper-2",
            );
            return n.link ? (
              <Link
                key={n.id}
                href={n.link}
                className={baseClass}
                onClick={() => markRead(n.id)}
              >
                {Inner}
              </Link>
            ) : (
              <div key={n.id} className={baseClass} onClick={() => markRead(n.id)}>
                {Inner}
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={clearOpen}
        onClose={() => setClearOpen(false)}
        onConfirm={clearRead}
        title="Clear read notifications?"
        message={<>This permanently removes all read notifications from your inbox.</>}
        confirmLabel="Clear"
        variant="danger"
      />
    </>
  );
}
