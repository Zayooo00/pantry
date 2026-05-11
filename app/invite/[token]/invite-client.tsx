"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/button";
import { invalidateApi } from "@/lib/api/client";

type InviteState =
  | { status: "loading" }
  | {
      status: "ready";
      invite: { email: string; role: string; expiresAt: string; acceptedAt: string | null };
      room: { id: string; name: string; glyph: string };
      inviter: { name: string; email: string } | null;
    }
  | { status: "error"; message: string };

export function InviteClient({ token }: { token: string }) {
  const router = useRouter();
  const { data: session, status: sessionStatus, update: updateSession } = useSession();
  const [state, setState] = useState<InviteState>({ status: "loading" });
  const [accepting, setAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/invites/${encodeURIComponent(token)}`);
        const json = await res.json();
        if (cancelled) {
          return;
        }
        if (!res.ok) {
          setState({
            status: "error",
            message: typeof json?.error === "string" ? json.error : "Invite not found.",
          });
          return;
        }
        setState({
          status: "ready",
          invite: json.invite,
          room: json.room,
          inviter: json.inviter,
        });
        setIsExpired(new Date(json.invite.expiresAt).getTime() < Date.now());
      } catch {
        if (!cancelled) {
          setState({ status: "error", message: "Couldn't load this invite." });
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function accept() {
    setAcceptError(null);
    setAccepting(true);
    let res: Response;
    try {
      res = await fetch(`/api/invites/${encodeURIComponent(token)}`, { method: "POST" });
    } catch {
      setAcceptError("Couldn't reach the server.");
      setAccepting(false);
      return;
    }
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setAcceptError(typeof json?.error === "string" ? json.error : "Couldn't accept invite.");
      setAccepting(false);
      return;
    }
    await updateSession();
    router.push(`/rooms/${json.roomId}`);
    void invalidateApi("/api/sidebar");
  }

  if (state.status === "loading") {
    return (
      <div className="text-center font-display text-lg text-ink-3 italic">Loading invite…</div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="w-full max-w-md rounded-xl border border-tomato-2 bg-tomato-3 p-8 text-center">
        <div className="font-display text-2xl text-tomato-2">{state.message}</div>
        <Button asChild variant="secondary" className="mt-6 inline-block">
          <Link href="/dashboard">Back to Pantry</Link>
        </Button>
      </div>
    );
  }

  const { invite, room, inviter } = state;
  const sessionEmail = session?.user?.email?.toLowerCase();
  const inviteEmail = invite.email.toLowerCase();
  const wrongAccount = sessionStatus === "authenticated" && sessionEmail !== inviteEmail;
  const callbackPath = `/invite/${encodeURIComponent(token)}`;

  return (
    <div className="w-full max-w-md rounded-xl border border-paper-3 bg-paper-1 p-8 shadow-[0_12px_40px_rgba(26,24,20,0.06)]">
      <div className="caption mb-3">YOU'RE INVITED</div>
      <h1 className="m-0 font-display text-3xl leading-tight font-light tracking-display">
        Share <em className="font-normal italic">{room.name.toLowerCase()}</em>?
      </h1>
      <p className="mt-3 font-display text-md text-ink-3 italic">
        {inviter ? <strong className="text-ink-2 not-italic">{inviter.name}</strong> : "Someone"}{" "}
        invited <strong className="text-ink-2 not-italic">{invite.email}</strong> to join as{" "}
        <strong className="text-ink-2 not-italic">{invite.role}</strong>.
      </p>

      {invite.acceptedAt && (
        <div className="mt-4 rounded-md border border-olive-2 bg-olive-3 px-3 py-2 font-display text-sm text-ink-2">
          You already accepted this invite.
        </div>
      )}

      {isExpired && (
        <div className="mt-4 rounded-md border border-tomato-2 bg-tomato-3 px-3 py-2 font-display text-sm text-tomato-2">
          This invite has expired. Ask {inviter?.name ?? "the owner"} to send a new one.
        </div>
      )}

      {!invite.acceptedAt && !isExpired && (
        <>
          {sessionStatus === "unauthenticated" && (
            <div className="mt-6 flex flex-col gap-2">
              <p className="font-display text-sm text-ink-3 italic">
                You'll need a Pantry account first.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="primary">
                  <Link
                    href={`/sign-up?email=${encodeURIComponent(invite.email)}&inviteToken=${encodeURIComponent(token)}&next=${encodeURIComponent(callbackPath)}`}
                  >
                    Create account
                  </Link>
                </Button>
                <Button asChild variant="secondary">
                  <Link href={`/sign-in?next=${encodeURIComponent(callbackPath)}`}>Sign in</Link>
                </Button>
              </div>
            </div>
          )}

          {wrongAccount && (
            <div className="mt-6">
              <div className="rounded-md border border-tomato-2 bg-tomato-3 px-3 py-2 font-display text-sm text-tomato-2">
                You're signed in as {session?.user?.email}, but this invite is for {invite.email}.
              </div>
              <Button asChild variant="secondary" className="mt-3 inline-block">
                <Link
                  href={`/api/auth/signout?callbackUrl=${encodeURIComponent(`/sign-in?next=${encodeURIComponent(callbackPath)}`)}`}
                >
                  Sign out & switch
                </Link>
              </Button>
            </div>
          )}

          {sessionStatus === "authenticated" && !wrongAccount && (
            <div className="mt-6">
              <Button variant="primary" onClick={accept} disabled={accepting}>
                {accepting ? "Accepting…" : `Accept & open ${room.name}`}
              </Button>
              {acceptError && (
                <div className="mt-3 rounded-md border border-tomato-2 bg-tomato-3 px-3 py-2 font-display text-sm text-tomato-2">
                  {acceptError}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
