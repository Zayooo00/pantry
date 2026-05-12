"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BarcodeScanner } from "@/components/barcode-scanner";
import { Button } from "@/components/button";
import { useToast } from "@/components/toast";
import { formatCount } from "@/lib/format";
import { invalidateApi } from "@/lib/api/client";

type Lookup = {
  code: string;
  match: {
    id: string;
    name: string;
    brand: string | null;
    photoUrl: string | null;
    roomId: string;
    roomName: string;
    roomGlyph: string;
    count: number;
    unit: string;
    openedAt: string | null;
  } | null;
  off: {
    name: string;
    brand: string | null;
    imageUrl: string | null;
    quantity: string | null;
  } | null;
};

type Phase = "scanning" | "looking-up" | "result" | "error";

export function ScanClient({ initialCode }: { initialCode: string | null }) {
  const { toast } = useToast();
  const [phase, setPhase] = useState<Phase>(initialCode ? "looking-up" : "scanning");
  const [lookup, setLookup] = useState<Lookup | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const ranInitialRef = useRef(false);

  async function runLookup(code: string) {
    setPhase("looking-up");
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/barcode/${encodeURIComponent(code)}`);
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { error?: string };
        setErrorMessage(typeof json.error === "string" ? json.error : "Lookup failed.");
        setPhase("error");
        return;
      }
      const data = (await res.json()) as Lookup;
      setLookup(data);
      setPhase("result");
    } catch {
      setErrorMessage("Lookup failed.");
      setPhase("error");
    }
  }

  useEffect(() => {
    if (initialCode && !ranInitialRef.current) {
      ranInitialRef.current = true;
      void runLookup(initialCode);
    }
  }, [initialCode]);

  function scanAgain() {
    setLookup(null);
    setErrorMessage(null);
    setPhase("scanning");
  }

  async function bumpCount(itemId: string, currentCount: number) {
    setActionBusy(true);
    try {
      const res = await fetch(`/api/items/${itemId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ count: currentCount + 1 }),
      });
      if (!res.ok) {
        throw new Error("Update failed.");
      }
      toast(<>Count updated.</>);
      void invalidateApi("/api/sidebar");
      scanAgain();
    } catch {
      toast(<>Couldn't update the count.</>);
    } finally {
      setActionBusy(false);
    }
  }

  async function markOpened(itemId: string) {
    setActionBusy(true);
    try {
      const res = await fetch(`/api/items/${itemId}/open`, { method: "POST" });
      if (!res.ok) {
        throw new Error("Open failed.");
      }
      toast(<>Marked open.</>);
      scanAgain();
    } catch {
      toast(<>Couldn't mark it open.</>);
    } finally {
      setActionBusy(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-160 flex-col gap-6">
      <div>
        <div className="caption">SCAN</div>
        <h1 className="m-0 mt-2 font-display text-3xl leading-none font-light tracking-display sm:text-4xl">
          Point at a <em className="font-normal italic">barcode</em>.
        </h1>
        <div className="mt-3 font-display text-md font-light text-ink-3 italic">
          We'll check your pantry and Open Food Facts.
        </div>
      </div>

      {phase === "scanning" && <BarcodeScanner onDetect={(code) => void runLookup(code)} />}

      {phase === "looking-up" && (
        <div
          className="grid aspect-3/4 w-full place-items-center rounded-lg border border-paper-3 bg-paper-1 sm:aspect-video"
          data-testid="scan-looking-up"
        >
          <div className="font-mono text-2xs tracking-mono text-ink-3 uppercase">Looking up…</div>
        </div>
      )}

      {phase === "error" && (
        <div className="flex flex-col gap-3">
          <div className="rounded-md border border-tomato-2 bg-tomato-3 px-3 py-2 font-display text-sm text-tomato-2">
            {errorMessage ?? "Something went wrong."}
          </div>
          <div>
            <Button variant="primary" onClick={scanAgain}>
              Scan again
            </Button>
          </div>
        </div>
      )}

      {phase === "result" && lookup && (
        <ResultPanel
          lookup={lookup}
          actionBusy={actionBusy}
          onScanAgain={scanAgain}
          onBumpCount={(itemId, count) => void bumpCount(itemId, count)}
          onMarkOpened={(itemId) => void markOpened(itemId)}
        />
      )}
    </div>
  );
}

function ResultPanel({
  lookup,
  actionBusy,
  onScanAgain,
  onBumpCount,
  onMarkOpened,
}: {
  lookup: Lookup;
  actionBusy: boolean;
  onScanAgain: () => void;
  onBumpCount: (itemId: string, currentCount: number) => void;
  onMarkOpened: (itemId: string) => void;
}) {
  if (lookup.match) {
    const m = lookup.match;
    return (
      <div className="flex flex-col gap-4 rounded-xl border border-olive-2 bg-olive/10 p-5">
        <div className="flex items-start gap-4">
          {m.photoUrl ? (
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md border border-paper-3 bg-paper-0">
              <Image
                src={m.photoUrl}
                alt=""
                fill
                sizes="80px"
                className="object-cover"
                unoptimized={m.photoUrl.startsWith("/api/photos/")}
              />
            </div>
          ) : (
            <div className="grid h-20 w-20 shrink-0 place-items-center rounded-md border border-paper-3 bg-paper-0 font-mono text-2xs tracking-mono text-ink-4 uppercase">
              {m.name.slice(0, 4)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="font-mono text-2xs tracking-mono text-olive-2 uppercase">
              Already in your pantry
            </div>
            <div className="mt-1 font-display text-2xl">{m.name}</div>
            {m.brand && <div className="font-display text-sm text-ink-3 italic">{m.brand}</div>}
            <div className="mt-1 font-mono text-2xs tracking-mono text-ink-3 uppercase">
              {m.roomName} · {formatCount(m.count)} {m.unit}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="primary" size="sm">
            <Link href={`/items/${m.id}`}>Open item</Link>
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={actionBusy}
            onClick={() => onBumpCount(m.id, m.count)}
          >
            +1 {m.unit}
          </Button>
          {!m.openedAt && (
            <Button
              variant="ghost"
              size="sm"
              disabled={actionBusy}
              onClick={() => onMarkOpened(m.id)}
            >
              Mark opened
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onScanAgain}>
            Scan again
          </Button>
        </div>
      </div>
    );
  }

  if (lookup.off) {
    const off = lookup.off;
    return (
      <div className="flex flex-col gap-4 rounded-xl border border-paper-3 bg-paper-1 p-5">
        <div className="flex items-start gap-4">
          {off.imageUrl ? (
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md border border-paper-3 bg-paper-0">
              <Image src={off.imageUrl} alt="" fill sizes="80px" className="object-cover" />
            </div>
          ) : (
            <div className="grid h-20 w-20 shrink-0 place-items-center rounded-md border border-paper-3 bg-paper-0 font-mono text-2xs tracking-mono text-ink-4 uppercase">
              NEW
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="font-mono text-2xs tracking-mono text-ink-3 uppercase">
              Found on Open Food Facts
            </div>
            <div className="mt-1 font-display text-2xl">{off.name}</div>
            {(off.brand || off.quantity) && (
              <div className="font-display text-sm text-ink-3 italic">
                {[off.brand, off.quantity].filter(Boolean).join(" · ")}
              </div>
            )}
            <div className="mt-1 font-mono text-2xs tracking-mono text-ink-4 uppercase">
              Code · {lookup.code}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="primary" size="sm">
            <Link href={`/items/new?barcode=${lookup.code}&prefillFromOff=1`}>Add to pantry</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href={`/items/new?barcode=${lookup.code}`}>Add manually</Link>
          </Button>
          <Button variant="ghost" size="sm" onClick={onScanAgain}>
            Scan again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-paper-3 bg-paper-1 p-5">
      <div>
        <div className="font-mono text-2xs tracking-mono text-ink-3 uppercase">Unknown barcode</div>
        <div className="mt-1 font-display text-2xl">
          Not in your pantry, and Open Food Facts doesn't know it.
        </div>
        <div className="mt-1 font-mono text-2xs tracking-mono text-ink-4 uppercase">
          Code · {lookup.code}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="primary" size="sm">
          <Link href={`/items/new?barcode=${lookup.code}`}>Add manually</Link>
        </Button>
        <Button variant="ghost" size="sm" onClick={onScanAgain}>
          Scan again
        </Button>
      </div>
    </div>
  );
}
