"use client";

import Link from "next/link";
import { useState } from "react";
import { mutate as globalMutate } from "swr";
import { useToast } from "@/components/toast";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { RoomGlyph } from "@/icons";
import { cn } from "@/lib/cn";
import { button } from "@/components/button";
import { useMutation, useQuery } from "@/lib/api/client";

type SharedWithMe = {
  roomId: string;
  name: string;
  glyph: string;
  role: "viewer" | "editor";
  ownerName: string;
  ownerEmail: string;
};

type IShareEntry = {
  roomId: string;
  name: string;
  glyph: string;
  members: Array<{ userId: string; name: string; email: string; role: "viewer" | "editor" }>;
};

export function SharingSection({ currentUserId }: { currentUserId: string }) {
  const { data, isLoading, mutate: refetchShared } = useQuery("/api/me/shared");
  const { toast } = useToast();
  const [leaveTarget, setLeaveTarget] = useState<SharedWithMe | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<{
    room: IShareEntry;
    member: IShareEntry["members"][number];
  } | null>(null);

  const { trigger: triggerDelete } = useMutation("delete", "/api/rooms/{id}/members/{userId}", {
    onSuccess: () => {
      refetchShared();
      globalMutate(["pantry", "/api/sidebar"]);
    },
  });

  async function leave() {
    if (!leaveTarget) {
      return;
    }
    const t = leaveTarget;
    try {
      await triggerDelete({
        params: { path: { id: t.roomId, userId: currentUserId } },
      });
    } catch {
      toast(<>Couldn't leave room.</>);
      return;
    }
    toast(<>Left <em>{t.name}</em>.</>);
    setLeaveTarget(null);
  }

  async function revoke() {
    if (!revokeTarget) {
      return;
    }
    const { room, member } = revokeTarget;
    try {
      await triggerDelete({
        params: { path: { id: room.roomId, userId: member.userId } },
      });
    } catch {
      toast(<>Couldn't revoke access.</>);
      return;
    }
    toast(<>Removed <em>{member.name}</em> from {room.name}.</>);
    setRevokeTarget(null);
  }

  return (
    <>
      <section>
        <div className="mb-2 flex items-baseline justify-between border-t border-ink-1 pt-3">
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-2xs tracking-[0.16em] uppercase text-ink-4">04</span>
            <h2 className="m-0 font-display text-2xl tracking-[-0.01em]">Sharing</h2>
          </div>
        </div>
        <p className="mb-6 max-w-prose text-sm text-ink-3">
          Rooms shared with you, and rooms you've shared with others.
        </p>

        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <div className="font-mono text-2xs tracking-[0.16em] uppercase text-ink-4 mb-3">SHARED WITH YOU</div>
            {isLoading && <SharingListSkeleton rows={2} />}
            {data && data.sharedWithMe.length === 0 && (
              <div className="rounded-md border border-paper-3 bg-paper-1 p-4 text-sm text-ink-3 italic">
                Nothing yet — when someone invites you, it appears here.
              </div>
            )}
            {data && data.sharedWithMe.length > 0 && (
              <div className="overflow-hidden rounded-md border border-paper-3 bg-paper-0">
                {data.sharedWithMe.map((r) => (
                  <div
                    key={r.roomId}
                    className="grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-dashed border-paper-3 px-3 py-3 last:border-0"
                  >
                    <span className="text-ink-2">
                      <RoomGlyph name={r.glyph} size={18} />
                    </span>
                    <div className="min-w-0">
                      <Link
                        href={`/rooms/${r.roomId}`}
                        className="block truncate text-base font-medium transition-colors hover:text-olive-2"
                      >
                        {r.name}
                      </Link>
                      <div className="font-mono text-2xs tracking-[0.16em] uppercase text-ink-4 truncate">
                        {r.role.toUpperCase()} · FROM {r.ownerEmail.toUpperCase()}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setLeaveTarget(r)}
                      className={cn(
                        button({ variant: "ghost", size: "sm" }),
                        "text-tomato-2 hover:border-tomato-2! hover:bg-tomato-3!",
                      )}
                    >
                      Leave
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="font-mono text-2xs tracking-[0.16em] uppercase text-ink-4 mb-3">YOU'RE SHARING</div>
            {isLoading && <SharingListSkeleton rows={2} />}
            {data && data.iShare.length === 0 && (
              <div className="rounded-md border border-paper-3 bg-paper-1 p-4 text-sm text-ink-3 italic">
                Nothing shared yet. Open a room and use <em>Members</em> to invite someone.
              </div>
            )}
            {data && data.iShare.length > 0 && (
              <div className="flex flex-col gap-3">
                {data.iShare.map((room) => (
                  <div
                    key={room.roomId}
                    className="overflow-hidden rounded-md border border-paper-3 bg-paper-0"
                  >
                    <div className="flex items-center gap-2 border-b border-paper-3 bg-paper-1 px-3 py-2">
                      <span className="text-ink-2">
                        <RoomGlyph name={room.glyph} size={16} />
                      </span>
                      <Link
                        href={`/rooms/${room.roomId}`}
                        className="text-sm font-medium transition-colors hover:text-olive-2"
                      >
                        {room.name}
                      </Link>
                      <span className="font-mono text-2xs tracking-[0.16em] uppercase text-ink-4 ml-auto">
                        {room.members.length} MEMBER{room.members.length === 1 ? "" : "S"}
                      </span>
                    </div>
                    {room.members.map((m) => (
                      <div
                        key={m.userId}
                        className="grid grid-cols-[1fr_auto_auto] items-center gap-3 border-b border-dashed border-paper-3 px-3 py-2 last:border-0"
                      >
                        <div className="min-w-0">
                          <div className="truncate text-sm">{m.name}</div>
                          <div className="font-mono text-2xs tracking-[0.16em] uppercase text-ink-4 truncate">{m.email.toUpperCase()}</div>
                        </div>
                        <span
                          className="font-mono text-2xs tracking-[0.16em] uppercase text-ink-4 rounded-full bg-paper-2 px-2 py-0.5"
                        >
                          {m.role.toUpperCase()}
                        </span>
                        <button
                          type="button"
                          onClick={() => setRevokeTarget({ room, member: m })}
                          className={cn(
                            button({ variant: "ghost", size: "sm" }),
                            "text-tomato-2 hover:border-tomato-2! hover:bg-tomato-3!",
                          )}
                        >
                          Revoke
                        </button>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <ConfirmDialog
        open={leaveTarget !== null}
        onClose={() => setLeaveTarget(null)}
        onConfirm={leave}
        title="Leave this room?"
        message={
          <>
            You'll no longer see <em>{leaveTarget?.name ?? "this room"}</em>. The owner can
            re-invite you later.
          </>
        }
        confirmLabel="Leave"
        variant="danger"
      />

      <ConfirmDialog
        open={revokeTarget !== null}
        onClose={() => setRevokeTarget(null)}
        onConfirm={revoke}
        title="Revoke access?"
        message={
          <>
            <em>{revokeTarget?.member.name ?? "This person"}</em> will no longer see{" "}
            <em>{revokeTarget?.room.name ?? "this room"}</em>.
          </>
        }
        confirmLabel="Revoke"
        variant="danger"
      />
    </>
  );
}

export function SharingListSkeleton({ rows = 2 }: { rows?: number }) {
  return (
    <div
      aria-hidden
      className="animate-pulse overflow-hidden rounded-md border border-paper-3 bg-paper-0"
    >
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-dashed border-paper-3 px-3 py-3 last:border-0"
        >
          <span className="block h-4 w-4 rounded-sm bg-paper-2" />
          <div>
            <span className="block h-4 w-32 rounded-sm bg-paper-2" />
            <span className="mt-2 block h-3 w-44 rounded-sm bg-paper-2" />
          </div>
          <span className="block h-7 w-14 rounded-sm bg-paper-2" />
        </div>
      ))}
    </div>
  );
}
