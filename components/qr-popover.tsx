"use client";

import { useEffect, useRef, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import type QRCodeStyling from "qr-code-styling";
import { QrIcon } from "@/icons";
import { Button, type ButtonVariantProps } from "./button";
import { useToast } from "./toast";
import { cn } from "@/lib/cn";

export function QrPopover({
  path,
  title,
  filename,
  size,
  className,
}: {
  path: string;
  title: React.ReactNode;
  filename: string;
  size?: ButtonVariantProps["size"];
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const qrRef = useRef<QRCodeStyling | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!open) {
      return;
    }
    let cancelled = false;
    void (async () => {
      const mod = await import("qr-code-styling");
      const container = containerRef.current;
      if (cancelled || !container) {
        return;
      }
      const styles = getComputedStyle(document.documentElement);
      const ink = styles.getPropertyValue("--color-ink-1").trim() || "#2b2620";
      const paper = styles.getPropertyValue("--color-paper-0").trim() || "#f7f3ea";

      const qr = new mod.default({
        width: 240,
        height: 240,
        type: "svg",
        data: `${window.location.origin}${path}`,
        margin: 4,
        qrOptions: { errorCorrectionLevel: "H" },
        dotsOptions: { color: ink, type: "rounded" },
        backgroundOptions: { color: paper },
        cornersSquareOptions: { color: ink, type: "extra-rounded" },
        cornersDotOptions: { color: ink, type: "dot" },
      });
      container.innerHTML = "";
      qr.append(container);
      qrRef.current = qr;
    })();

    return () => {
      cancelled = true;
    };
  }, [open, path]);

  const url = open && typeof window !== "undefined" ? `${window.location.origin}${path}` : null;

  function download() {
    if (qrRef.current) {
      void qrRef.current.download({ name: filename, extension: "png" });
    }
  }

  async function copy() {
    if (!url) {
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      toast(<>Link copied.</>);
    } catch {
      toast(<>Couldn't copy — your browser blocked clipboard access.</>);
    }
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <Button variant="ghost" size={size} className={cn("gap-2", className)}>
          <QrIcon /> QR
        </Button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="bottom"
          align="end"
          sideOffset={8}
          className="z-50 w-72 animate-[pantry-pop_.15s_var(--ease-pantry)] rounded-xl border border-ink-1 bg-paper-0 p-5 shadow-lg"
        >
          <div className="caption mb-3">{title}</div>
          <div
            ref={containerRef}
            className="flex h-60 w-full items-center justify-center rounded-md bg-paper-0"
          />
          {url && (
            <>
              <div className="mt-3 font-mono text-3xs tracking-eyebrow-loose break-all text-ink-3">
                {url}
              </div>
              <div className="mt-3 flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={copy}>
                  Copy link
                </Button>
                <Button variant="ghost" size="sm" onClick={download}>
                  Download label
                </Button>
              </div>
            </>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
