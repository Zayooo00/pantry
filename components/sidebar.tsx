"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { cva } from "class-variance-authority";
import useSWR from "swr";
import {
  ActivityIcon,
  BellIcon,
  BrandMark,
  GridIcon,
  HomeIcon,
  ListIcon,
  SearchIcon,
  SettingsIcon,
  RoomGlyph,
} from "@/icons";
import { Modal } from "./modal";
import { NewRoomForm } from "./new-room-form";
import { cn } from "@/lib/cn";
import { useQuery } from "@/lib/api/client";

async function unreadFetcher() {
  const res = await fetch("/api/notifications/unread-count");
  if (!res.ok) {
    return { count: 0 };
  }
  return res.json() as Promise<{ count: number }>;
}

const navItem = cva(
  "flex items-center gap-3 px-3 py-2 rounded-md text-sm cursor-pointer no-underline transition-colors",
  {
    variants: {
      active: {
        true: "bg-ink-1 text-paper-0 hover:bg-ink-1 hover:text-paper-0",
        false: "text-ink-2 hover:bg-paper-2 hover:text-ink-0",
      },
    },
    defaultVariants: { active: false },
  },
);

export function Sidebar({
  drawerOpen = false,
  onCloseDrawer,
}: {
  drawerOpen?: boolean;
  onCloseDrawer?: () => void;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { data } = useQuery("/api/sidebar");
  const { data: unread } = useSWR(
    ["pantry", "/api/notifications/unread-count"],
    unreadFetcher,
    { refreshInterval: 60_000, revalidateOnFocus: true },
  );
  const [newRoomOpen, setNewRoomOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const isLoading = data === undefined;
  const rooms = data?.rooms ?? [];
  const shoppingCount = data?.shoppingCount ?? 0;
  const unreadCount = unread?.count ?? 0;

  const isActive = (href: string) => pathname === href;
  const isActiveRoom = (id: string) => pathname === `/rooms/${id}`;

  const initials = (session?.user?.name ?? "?")
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  useEffect(() => {
    if (!drawerOpen) {
      return;
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onCloseDrawer?.();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen, onCloseDrawer]);

  useEffect(() => {
    if (drawerOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [drawerOpen]);

  function handleNavClick() {
    onCloseDrawer?.();
  }

  return (
    <>
      {/* Backdrop — mobile only when drawer open */}
      <div
        aria-hidden
        onClick={onCloseDrawer}
        className={cn(
          "md:hidden fixed inset-0 z-40 bg-ink-0/55 backdrop-blur-[2px] transition-opacity duration-200",
          drawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
      />

      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-screen w-70 max-w-[85vw] flex flex-col gap-6 overflow-y-auto bg-paper-1 border-r border-paper-3 px-4 py-6 transition-transform duration-200 ease-pantry",
          drawerOpen ? "translate-x-0" : "-translate-x-full",
          "md:sticky md:top-0 md:z-auto md:h-screen md:w-auto md:max-w-none md:translate-x-0 md:transition-none",
        )}
      >
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            onClick={handleNavClick}
            className="flex items-center gap-3 px-2 group"
          >
            <BrandMark size={32} />
            <div>
              <div className="font-display text-xl font-normal tracking-[-0.01em] group-hover:text-olive-2 transition-colors">
                Pantry
              </div>
              <span className="block font-mono text-3xs tracking-[0.2em] text-ink-4 mt-0.5">
                EST. KITCHEN
              </span>
            </div>
          </Link>
          <button
            type="button"
            onClick={onCloseDrawer}
            className="md:hidden w-8 h-8 rounded-full border border-transparent bg-transparent text-ink-2 grid place-items-center cursor-pointer transition-all duration-150 ease-pantry hover:bg-paper-2 hover:text-ink-0 hover:border-paper-3 active:scale-95"
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-0.5">
          <div className="font-mono text-2xs tracking-[0.16em] uppercase text-ink-4 px-3 pb-2">
            General
          </div>
          <Link
            href="/dashboard"
            onClick={handleNavClick}
            className={navItem({ active: isActive("/dashboard") })}
          >
            <HomeIcon />
            <span>Dashboard</span>
          </Link>
          <Link
            href="/rooms"
            onClick={handleNavClick}
            className={navItem({ active: isActive("/rooms") })}
          >
            <GridIcon />
            <span>All rooms</span>
          </Link>
          <Link
            href="/search"
            onClick={handleNavClick}
            className={navItem({ active: isActive("/search") })}
          >
            <SearchIcon />
            <span>Search</span>
          </Link>
          <Link
            href="/activity"
            onClick={handleNavClick}
            className={navItem({ active: isActive("/activity") })}
          >
            <ActivityIcon />
            <span>Activity</span>
          </Link>
          <Link
            href="/notifications"
            onClick={handleNavClick}
            className={navItem({ active: isActive("/notifications") })}
          >
            <BellIcon />
            <span>Notifications</span>
            {unreadCount > 0 && (
              <span
                className={cn(
                  "ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-tomato-2 px-1.5 font-mono text-2xs leading-none text-paper-0",
                  isActive("/notifications") && "bg-paper-0 text-ink-1",
                )}
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Link>
          <Link
            href="/shopping"
            onClick={handleNavClick}
            className={navItem({ active: isActive("/shopping") })}
          >
            <ListIcon />
            <span>Shopping list</span>
            {shoppingCount > 0 && (
              <span
                className={cn(
                  "ml-auto font-mono text-2xs text-ink-4",
                  isActive("/shopping") && "text-paper-3",
                )}
              >
                {shoppingCount}
              </span>
            )}
          </Link>
        </div>

        <div className="flex flex-col gap-0.5">
          <div className="font-mono text-2xs tracking-[0.16em] uppercase text-ink-4 px-3 pb-2">
            Rooms
          </div>
          {isLoading ? (
            <SidebarRoomsSkeleton />
          ) : (
            rooms.map((r) => (
              <Link
                key={r.id}
                href={`/rooms/${r.id}`}
                onClick={handleNavClick}
                className={cn(navItem({ active: isActiveRoom(r.id) }), "group")}
              >
                <span className="opacity-85"><RoomGlyph name={r.glyph} size={16} /></span>
                <span className="truncate flex-1 flex items-center gap-1.5 min-w-0">
                  <span className="truncate">{r.name}</span>
                  {r.role !== "owner" && (
                    <span
                      className={cn(
                        "shrink-0 font-mono text-4xs tracking-[0.18em] uppercase opacity-70",
                        isActiveRoom(r.id) && "opacity-90",
                      )}
                      title={`Shared · ${r.role}`}
                    >
                      ◇
                    </span>
                  )}
                </span>
                {r.low > 0 && (
                  <span
                    className={cn(
                      "ml-auto font-mono text-2xs",
                      isActiveRoom(r.id)
                        ? "text-tomato-3"
                        : "text-tomato-2 group-hover:text-tomato",
                    )}
                  >
                    {r.low}↓
                  </span>
                )}
                {r.low === 0 && (
                  <span
                    className={cn(
                      "ml-auto font-mono text-2xs text-ink-4",
                      isActiveRoom(r.id) && "text-paper-3",
                    )}
                  >
                    {r.count}
                  </span>
                )}
              </Link>
            ))
          )}
          <button
            type="button"
            onClick={() => setNewRoomOpen(true)}
            className={cn(navItem(), "text-ink-4 text-xs hover:text-olive-2 text-left")}
          >
            + New room
          </button>
        </div>

        <div className="mt-auto" />
        <div className="flex flex-col gap-0.5 border-t border-paper-3 pt-4 relative">
          <Link
            href="/settings"
            onClick={handleNavClick}
            className={navItem({ active: isActive("/settings") })}
          >
            <SettingsIcon />
            <span>Settings</span>
          </Link>
          <Popover.Root open={menuOpen} onOpenChange={setMenuOpen}>
            <Popover.Trigger asChild>
              <button
                type="button"
                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-paper-2 transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-full bg-olive text-paper-0 grid place-items-center font-display text-md border border-ink-1">
                  {initials}
                </div>
                <div className="leading-tight flex-1 min-w-0">
                  <div className="text-sm text-ink-1 truncate">{session?.user?.name ?? "—"}</div>
                  <div className="font-mono text-xs tracking-[0.06em] uppercase text-ink-4 truncate">
                    {session?.user?.email ?? ""}
                  </div>
                </div>
                <span
                  aria-hidden
                  className={cn(
                    "inline-block text-ink-4 transition-transform duration-150 ease-pantry",
                    menuOpen ? "rotate-90" : "rotate-0",
                  )}
                >
                  ▸
                </span>
              </button>
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Content
                side="top"
                align="start"
                sideOffset={8}
                className="z-50 w-(--radix-popover-trigger-width) overflow-hidden rounded-md border border-ink-1 bg-paper-0 shadow-lg animate-[pantry-pop_.15s_var(--ease-pantry)]"
              >
                <Link
                  href="/settings"
                  onClick={() => { setMenuOpen(false); handleNavClick(); }}
                  className="block px-3 py-2 text-sm hover:bg-paper-2 transition-colors"
                >
                  Profile &amp; settings
                </Link>
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/welcome" })}
                  className="block w-full text-left px-3 py-2 text-sm text-tomato-2 hover:bg-tomato-3 transition-colors"
                >
                  Sign out
                </button>
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>
        </div>
      </aside>

      <Modal open={newRoomOpen} onClose={() => setNewRoomOpen(false)} title={<>New <em>room</em></>}>
        <NewRoomForm onClose={() => setNewRoomOpen(false)} />
      </Modal>
    </>
  );
}

export function SidebarRoomsSkeleton({ rows = 4 }: { rows?: number }) {
  const widths = ["w-24", "w-20", "w-28", "w-16", "w-22"];
  return (
    <div aria-hidden className="flex flex-col gap-0.5 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 px-3 py-2 rounded-md"
        >
          <span className="block w-4 h-4 rounded-sm bg-paper-3" />
          <span className={cn("block h-3 rounded-sm bg-paper-3", widths[i % widths.length])} />
        </div>
      ))}
    </div>
  );
}
