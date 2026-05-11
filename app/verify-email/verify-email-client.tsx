"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/button";

type ConfirmState =
  | { status: "idle" }
  | { status: "confirming" }
  | { status: "ok"; email: string }
  | { status: "error"; message: string };

export function VerifyEmailClient({
  token,
  email,
  sendStatus,
}: {
  token?: string;
  email?: string;
  sendStatus: "sent" | "not_configured" | null;
}) {
  const { update: updateSession, status: sessionStatus } = useSession();
  const [confirm, setConfirm] = useState<ConfirmState>({
    status: token ? "confirming" : "idle",
  });
  const [resend, setResend] = useState<{
    status: "idle" | "sending" | "ok" | "error";
    message?: string;
  }>({ status: "idle" });

  useEffect(() => {
    if (!token) {
      return;
    }
    let cancelled = false;
    async function run() {
      try {
        const res = await fetch(`/api/verify-email?token=${encodeURIComponent(token!)}`);
        const json = await res.json().catch(() => ({}));
        if (cancelled) {
          return;
        }
        if (!res.ok) {
          setConfirm({
            status: "error",
            message:
              typeof json?.error === "string" ? json.error : "This link is invalid or expired.",
          });
          return;
        }
        // Tell next-auth to re-fetch the user so middleware sees emailVerified.
        // Safe to call when unauthenticated — it's a no-op then.
        await updateSession();
        if (cancelled) {
          return;
        }
        setConfirm({ status: "ok", email: json.email });
      } catch {
        if (!cancelled) {
          setConfirm({ status: "error", message: "Couldn't reach the server." });
        }
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [token, updateSession]);

  async function onResend() {
    if (!email) {
      return;
    }
    setResend({ status: "sending" });
    let res: Response;
    try {
      res = await fetch("/api/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } catch {
      setResend({ status: "error", message: "Couldn't reach the server." });
      return;
    }
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setResend({
        status: "error",
        message: typeof json?.error === "string" ? json.error : "Couldn't resend. Try again.",
      });
      return;
    }
    setResend({ status: "ok" });
  }

  const body =
    confirm.status === "confirming" ? (
      <div className="rounded-md border border-paper-3 bg-paper-1 px-4 py-4 font-display text-sm text-ink-3 italic">
        Confirming your email…
      </div>
    ) : confirm.status === "ok" ? (
      <div className="flex flex-col gap-4">
        <div className="rounded-md border border-olive-2 bg-olive-3 px-4 py-4 font-display text-sm text-ink-2">
          Confirmed <strong className="not-italic">{confirm.email}</strong>. Your account is ready.
        </div>
        <Button asChild variant="primary" size="lg" className="w-full text-center">
          <Link href="/dashboard">Continue →</Link>
        </Button>
      </div>
    ) : confirm.status === "error" ? (
      <div className="flex flex-col gap-4">
        <div className="rounded-md border border-tomato-2 bg-tomato-3 px-4 py-4 font-display text-sm text-tomato-2">
          {confirm.message}
        </div>
        {email && (
          <ResendBlock
            email={email}
            resend={resend}
            onResend={onResend}
            idleLabel="Send a fresh link"
          />
        )}
      </div>
    ) : (
      <div className="flex flex-col gap-4">
        <div className="rounded-md border border-paper-3 bg-paper-1 px-4 py-4 font-display text-sm text-ink-2">
          {!email ? (
            <>
              Enter the email from your sign-up to receive a fresh verification link, or follow the
              link from the email we sent.
            </>
          ) : sendStatus === "sent" ? (
            <>
              We sent a link to <strong className="not-italic">{email}</strong>. Click it to confirm
              your email and finish creating your account.
            </>
          ) : sendStatus === "not_configured" ? (
            <>
              Email isn't configured on this server yet, so we couldn't send a verification link to{" "}
              <strong className="not-italic">{email}</strong>. Ask the owner to set SMTP_USER,
              SMTP_PASS, and EMAIL_FROM, then resend.
            </>
          ) : (
            <>
              Confirm <strong className="not-italic">{email}</strong> by clicking the link we sent.
              If it didn't arrive, resend below.
            </>
          )}
        </div>
        {email && (
          <ResendBlock
            email={email}
            resend={resend}
            onResend={onResend}
            idleLabel="Resend verification link"
          />
        )}
      </div>
    );

  return (
    <>
      {body}
      <div className="mt-6 border-t border-dashed border-paper-3 pt-4 font-display text-sm text-ink-3 italic">
        {sessionStatus === "authenticated" ? (
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/sign-in" })}
            className="cursor-pointer border-b border-ink-1 pb-px text-ink-1 not-italic transition-colors duration-150 ease-pantry hover:border-olive-2 hover:text-olive-2"
          >
            Sign out & use a different account →
          </button>
        ) : (
          <Link
            href="/sign-in"
            className="border-b border-ink-1 pb-px text-ink-1 not-italic transition-colors duration-150 ease-pantry hover:border-olive-2 hover:text-olive-2"
          >
            ← Back to sign in
          </Link>
        )}
      </div>
    </>
  );
}

function ResendBlock({
  email,
  resend,
  onResend,
  idleLabel,
}: {
  email: string;
  resend: { status: "idle" | "sending" | "ok" | "error"; message?: string };
  onResend: () => void;
  idleLabel: string;
}) {
  if (resend.status === "ok") {
    return (
      <div className="rounded-md border border-olive-2 bg-olive-3 px-4 py-4 font-display text-sm text-ink-2">
        If <strong className="not-italic">{email}</strong> needs verification, we've sent a fresh
        link.
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="secondary"
        size="md"
        className="w-full"
        onClick={onResend}
        disabled={resend.status === "sending"}
      >
        {resend.status === "sending" ? "Sending…" : idleLabel}
      </Button>
      {resend.status === "error" && resend.message && (
        <div className="rounded-md border border-tomato-2 bg-tomato-3 px-3.5 py-2.5 font-display text-sm text-tomato-2">
          {resend.message}
        </div>
      )}
    </div>
  );
}
