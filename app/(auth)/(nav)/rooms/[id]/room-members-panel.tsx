"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Select } from "@/components/select";
import { useToast } from "@/components/toast";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { button } from "@/components/button";
import { cn } from "@/lib/cn";
import { useMutation, useQuery } from "@/lib/api/client";

type Member = {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: "viewer" | "editor";
  createdAt: string;
};

const InviteSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email."),
  role: z.enum(["viewer", "editor"]),
});

type InviteValues = z.infer<typeof InviteSchema>;

export function RoomMembersPanel({ roomId, roomName }: { roomId: string; roomName: string }) {
  const queryParams = { params: { path: { id: roomId } } };
  const {
    data,
    isLoading,
    error,
    mutate: refetchMembers,
  } = useQuery("/api/rooms/{id}/members", queryParams);
  const { toast } = useToast();
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<Member | null>(null);

  const form = useForm<InviteValues>({
    resolver: zodResolver(InviteSchema),
    defaultValues: { email: "", role: "viewer" },
  });

  const { trigger: triggerInvite } = useMutation("post", "/api/rooms/{id}/members", {
    onSuccess: () => refetchMembers(),
  });
  const { trigger: triggerPatch } = useMutation("patch", "/api/rooms/{id}/members/{userId}", {
    onSuccess: () => refetchMembers(),
  });
  const { trigger: triggerDelete } = useMutation("delete", "/api/rooms/{id}/members/{userId}", {
    onSuccess: () => refetchMembers(),
  });

  async function invite(values: InviteValues) {
    setInviteError(null);
    let result: { pending?: { registered?: boolean } } | undefined;
    try {
      result = (await triggerInvite({
        params: { path: { id: roomId } },
        body: values,
      })) as { pending?: { registered?: boolean } };
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : "Could not send invite.");
      return;
    }
    toast(
      result?.pending?.registered ? (
        <>
          Invited <em>{values.email}</em>. They'll see it in their inbox and email.
        </>
      ) : (
        <>
          Sent invite to <em>{values.email}</em>. They'll get an email with a sign-up link.
        </>
      ),
    );
    form.reset({ email: "", role: values.role });
  }

  async function changeRole(m: Member, role: "viewer" | "editor") {
    try {
      await triggerPatch({
        params: { path: { id: roomId, userId: m.userId } },
        body: { role },
      });
    } catch {
      toast(<>Couldn't update role.</>);
    }
  }

  async function remove() {
    if (!removeTarget) {
      return;
    }
    const m = removeTarget;
    try {
      await triggerDelete({ params: { path: { id: roomId, userId: m.userId } } });
    } catch {
      toast(<>Couldn't remove access.</>);
      return;
    }
    toast(
      <>
        Removed <em>{m.name}</em>.
      </>,
    );
    setRemoveTarget(null);
  }

  return (
    <section className="mt-12 md:mt-16">
      <div className="mb-6 flex items-baseline justify-between border-t border-ink-1 pt-3">
        <h2 className="m-0 font-display text-2xl tracking-display-sm">
          <em className="italic">Members</em>.
        </h2>
        <span className="font-mono text-2xs tracking-eyebrow text-ink-4 uppercase">OWNER ONLY</span>
      </div>

      <div className="rounded-xl border border-paper-3 bg-paper-1 p-5 md:p-8">
        <div className="mb-3 font-mono text-2xs tracking-eyebrow text-ink-4 uppercase">
          INVITE BY EMAIL
        </div>
        <form
          onSubmit={form.handleSubmit(invite)}
          className="grid grid-cols-1 items-end gap-3 md:grid-cols-[1fr_240px_auto]"
          noValidate
        >
          <div>
            <label className="mb-2 block font-mono text-2xs tracking-eyebrow text-ink-3 uppercase">
              Email
            </label>
            <input
              className="w-full rounded-md border border-paper-4 bg-paper-0 px-3.5 py-3 font-sans text-base transition-[border-color] duration-150 ease-pantry outline-none placeholder:text-ink-4 hover:border-ink-3 focus:border-ink-1"
              type="email"
              placeholder="someone@example.com"
              autoComplete="email"
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <div className="mt-1 text-sm text-tomato-2">
                {form.formState.errors.email.message}
              </div>
            )}
          </div>
          <div>
            <label className="mb-2 block font-mono text-2xs tracking-eyebrow text-ink-3 uppercase">
              Role
            </label>
            <Controller
              control={form.control}
              name="role"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onChange={(v) => field.onChange(v)}
                  options={[
                    { value: "viewer", label: "Viewer (read-only)" },
                    { value: "editor", label: "Editor (can edit items)" },
                  ]}
                />
              )}
            />
          </div>
          <button
            type="submit"
            disabled={form.formState.isSubmitting}
            className={button({ variant: "primary", size: "md" })}
          >
            {form.formState.isSubmitting ? "Inviting…" : "Invite"}
          </button>
        </form>
        {inviteError && (
          <div className="mt-3 rounded-md border border-tomato-2 bg-tomato-3 px-3 py-2 text-sm text-tomato-2">
            {inviteError}
          </div>
        )}
        <div className="mt-2 font-mono text-2xs tracking-eyebrow text-ink-4 uppercase">
          THEY'LL GET AN EMAIL AND AN IN-APP NOTIFICATION TO ACCEPT.
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-paper-3 bg-paper-0">
        {error && <div className="p-6 text-sm text-tomato-2">Couldn't load members.</div>}
        {isLoading && <RoomMembersListSkeleton />}
        {data && data.owner && (
          <div className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b border-dashed border-paper-3 px-4 py-3 md:px-6">
            <div className="min-w-0">
              <div className="truncate text-base font-medium">{data.owner.name}</div>
              <div className="truncate font-mono text-2xs tracking-eyebrow text-ink-4 uppercase">
                {data.owner.email.toUpperCase()}
              </div>
            </div>
            <span className="rounded-full bg-ink-1 px-2 py-1 font-mono text-2xs tracking-eyebrow text-paper-0 uppercase">
              OWNER
            </span>
            <span className="font-mono text-2xs tracking-eyebrow text-ink-4 uppercase">YOU</span>
          </div>
        )}
        {data && data.members.length === 0 && (
          <div className="p-8 text-center text-ink-3 italic">
            Just you here. Invite someone above to share <em>{roomName.toLowerCase()}</em>.
          </div>
        )}
        {data &&
          data.members.map((m) => (
            <div
              key={m.id}
              className="grid grid-cols-[1fr_auto_auto] items-center gap-3 border-b border-dashed border-paper-3 px-4 py-3 last:border-0 md:gap-4 md:px-6"
            >
              <div className="min-w-0">
                <div className="truncate text-base font-medium">{m.name}</div>
                <div className="truncate font-mono text-2xs tracking-eyebrow text-ink-4 uppercase">
                  {m.email.toUpperCase()}
                </div>
              </div>
              <Select
                value={m.role}
                onChange={(v) => changeRole(m, v as "viewer" | "editor")}
                size="sm"
                options={[
                  { value: "viewer", label: "Viewer" },
                  { value: "editor", label: "Editor" },
                ]}
              />
              <button
                type="button"
                onClick={() => setRemoveTarget(m)}
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

      <ConfirmDialog
        open={removeTarget !== null}
        onClose={() => setRemoveTarget(null)}
        onConfirm={remove}
        title="Revoke access?"
        message={
          <>
            <em>{removeTarget?.name ?? "This person"}</em> will no longer see <em>{roomName}</em>.
          </>
        }
        confirmLabel="Revoke"
        variant="danger"
      />
    </section>
  );
}

export function RoomMembersListSkeleton({ rows = 2 }: { rows?: number }) {
  return (
    <div aria-hidden className="animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b border-dashed border-paper-3 px-4 py-3 last:border-0 md:px-6"
        >
          <div className="min-w-0">
            <div className="h-4 w-32 rounded-sm bg-paper-2" />
            <div className="mt-2 h-3 w-44 rounded-sm bg-paper-2" />
          </div>
          <div className="h-7 w-24 rounded-sm bg-paper-2" />
          <div className="h-7 w-16 rounded-sm bg-paper-2" />
        </div>
      ))}
    </div>
  );
}
