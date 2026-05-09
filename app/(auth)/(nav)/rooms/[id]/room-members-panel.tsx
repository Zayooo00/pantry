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
  const { data, isLoading, error, mutate: refetchMembers } = useQuery(
    "/api/rooms/{id}/members",
    queryParams,
  );
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
    let result: { member?: unknown; pending?: unknown } | undefined;
    try {
      result = (await triggerInvite({
        params: { path: { id: roomId } },
        body: values,
      })) as { member?: unknown; pending?: unknown };
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : "Could not send invite.");
      return;
    }
    if (result?.pending) {
      toast(
        <>
          Sent invite to <em>{values.email}</em>. They'll get an email with a link.
        </>,
      );
    } else {
      toast(
        <>
          Added <em>{values.email}</em>.
        </>,
      );
    }
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
    toast(<>Removed <em>{m.name}</em>.</>);
    setRemoveTarget(null);
  }

  return (
    <section className="mt-12 md:mt-16">
      <div className="flex items-baseline justify-between border-t border-ink-1 pt-3 mb-6">
        <h2 className="font-display text-2xl m-0 tracking-display-sm">
          <em className="italic">Members</em>.
        </h2>
        <span className="font-mono text-2xs tracking-eyebrow uppercase text-ink-4">
          OWNER ONLY
        </span>
      </div>

      <div className="bg-paper-1 border border-paper-3 rounded-xl p-5 md:p-8">
        <div className="font-mono text-2xs tracking-eyebrow uppercase text-ink-4 mb-3">
          INVITE BY EMAIL
        </div>
        <form
          onSubmit={form.handleSubmit(invite)}
          className="grid gap-3 grid-cols-1 md:grid-cols-[1fr_240px_auto] items-end"
          noValidate
        >
          <div>
            <label className="block font-mono text-2xs tracking-eyebrow uppercase text-ink-3 mb-2">
              Email
            </label>
            <input
              className="w-full bg-paper-0 border border-paper-4 rounded-md px-3.5 py-3 text-base font-sans outline-none transition-[border-color] duration-150 ease-pantry hover:border-ink-3 focus:border-ink-1 placeholder:text-ink-4"
              type="email"
              placeholder="someone@example.com"
              autoComplete="email"
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <div className="text-tomato-2 text-sm mt-1">
                {form.formState.errors.email.message}
              </div>
            )}
          </div>
          <div>
            <label className="block font-mono text-2xs tracking-eyebrow uppercase text-ink-3 mb-2">
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
          <div className="mt-3 bg-tomato-3 border border-tomato-2 text-tomato-2 rounded-md px-3 py-2 text-sm">
            {inviteError}
          </div>
        )}
        <div className="font-mono text-2xs tracking-eyebrow uppercase text-ink-4 mt-2">
          IF THEY DON'T HAVE AN ACCOUNT, WE'LL EMAIL THEM A SIGN-UP LINK.
        </div>
      </div>

      <div className="mt-6 bg-paper-0 border border-paper-3 rounded-xl overflow-hidden">
        {error && (
          <div className="p-6 text-tomato-2 text-sm">
            Couldn't load members.
          </div>
        )}
        {isLoading && <RoomMembersListSkeleton />}
        {data && data.owner && (
          <div className="grid items-center grid-cols-[1fr_auto_auto] gap-4 px-4 md:px-6 py-3 border-b border-dashed border-paper-3">
            <div className="min-w-0">
              <div className="text-base font-medium truncate">{data.owner.name}</div>
              <div className="font-mono text-2xs tracking-eyebrow uppercase text-ink-4 truncate">
                {data.owner.email.toUpperCase()}
              </div>
            </div>
            <span className="font-mono text-2xs tracking-eyebrow uppercase px-2 py-1 rounded-full bg-ink-1 text-paper-0">
              OWNER
            </span>
            <span className="font-mono text-2xs tracking-eyebrow uppercase text-ink-4">
              YOU
            </span>
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
              className="grid items-center grid-cols-[1fr_auto_auto] gap-3 md:gap-4 px-4 md:px-6 py-3 border-b border-dashed border-paper-3 last:border-0"
            >
              <div className="min-w-0">
                <div className="text-base font-medium truncate">{m.name}</div>
                <div className="font-mono text-2xs tracking-eyebrow uppercase text-ink-4 truncate">
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
                  "text-tomato-2 hover:bg-tomato-3! hover:border-tomato-2!",
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
            <em>{removeTarget?.name ?? "This person"}</em> will no longer see{" "}
            <em>{roomName}</em>.
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
          className="grid items-center grid-cols-[1fr_auto_auto] gap-4 px-4 md:px-6 py-3 border-b border-dashed border-paper-3 last:border-0"
        >
          <div className="min-w-0">
            <div className="h-4 w-32 rounded-sm bg-paper-2" />
            <div className="h-3 w-44 rounded-sm bg-paper-2 mt-2" />
          </div>
          <div className="h-7 w-24 rounded-sm bg-paper-2" />
          <div className="h-7 w-16 rounded-sm bg-paper-2" />
        </div>
      ))}
    </div>
  );
}
