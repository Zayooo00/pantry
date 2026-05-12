"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/button";
import { TextInput } from "@/components/text-input";
import { cn } from "@/lib/cn";

type DetectedBarcode = { rawValue: string };

type BarcodeDetectorCtor = new (opts?: { formats?: string[] }) => {
  detect: (source: HTMLVideoElement | ImageBitmapSource) => Promise<DetectedBarcode[]>;
};

declare global {
  interface Window {
    BarcodeDetector?: BarcodeDetectorCtor;
  }
}

const FORMATS = ["ean_13", "ean_8", "upc_a", "upc_e", "code_128"];
const DEBOUNCE_MS = 1500;

export function BarcodeScanner({
  onDetect,
  onCancel,
  className,
}: {
  onDetect: (code: string) => void;
  onCancel?: () => void;
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const onDetectRef = useRef(onDetect);
  const lastDetectionRef = useRef<{ code: string; at: number } | null>(null);
  const [status, setStatus] = useState<"starting" | "scanning" | "error" | "manual">("starting");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [manualValue, setManualValue] = useState("");
  const [manualError, setManualError] = useState<string | null>(null);

  useEffect(() => {
    onDetectRef.current = onDetect;
  }, [onDetect]);

  useEffect(() => {
    if (status === "manual" || status === "error") {
      return;
    }
    const video = videoRef.current;
    let cancelled = false;
    let stream: MediaStream | null = null;
    let zxingStop: (() => void) | null = null;
    let rafId: number | null = null;

    function handleDetection(raw: string) {
      const cleaned = raw.replace(/\D/g, "");
      if (!/^\d{8,14}$/.test(cleaned)) {
        return;
      }
      const now = Date.now();
      const last = lastDetectionRef.current;
      if (last && last.code === cleaned && now - last.at < DEBOUNCE_MS) {
        return;
      }
      lastDetectionRef.current = { code: cleaned, at: now };
      navigator.vibrate?.(80);
      onDetectRef.current(cleaned);
    }

    async function start() {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        setStatus("error");
        setErrorMessage("Your browser doesn't support camera capture.");
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
      } catch (err) {
        if (cancelled) {
          return;
        }
        const name = err instanceof Error ? err.name : "";
        setStatus("error");
        if (name === "NotAllowedError" || name === "SecurityError") {
          setErrorMessage(
            "Camera permission denied. Allow it in your browser settings, or enter the barcode manually.",
          );
        } else if (name === "NotFoundError" || name === "OverconstrainedError") {
          setErrorMessage("No camera available on this device. Enter the barcode manually.");
        } else {
          setErrorMessage("Couldn't start the camera. Enter the barcode manually.");
        }
        return;
      }
      if (cancelled) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      const video = videoRef.current;
      if (!video) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      video.srcObject = stream;
      video.setAttribute("playsinline", "true");
      try {
        await video.play();
      } catch (err) {
        console.warn("barcode scanner: video.play() rejected", err);
      }
      setStatus("scanning");

      if (typeof window !== "undefined" && window.BarcodeDetector) {
        const detector = new window.BarcodeDetector({ formats: FORMATS });
        const loop = async () => {
          if (cancelled) {
            return;
          }
          try {
            const results = await detector.detect(video);
            if (results.length > 0) {
              handleDetection(results[0].rawValue);
            }
          } catch {
            // per-frame failures are expected during focus, ignore
          }
          if (!cancelled) {
            rafId = requestAnimationFrame(loop);
          }
        };
        loop();
      } else {
        try {
          const { BrowserMultiFormatReader } = await import("@zxing/browser");
          if (cancelled) {
            return;
          }
          const reader = new BrowserMultiFormatReader();
          const controls = await reader.decodeFromStream(stream, video, (result) => {
            if (result && !cancelled) {
              handleDetection(result.getText());
            }
          });
          zxingStop = () => controls.stop();
        } catch {
          if (!cancelled) {
            setStatus("error");
            setErrorMessage("Couldn't load the scanner. Enter the barcode manually.");
          }
        }
      }
    }

    start();

    return () => {
      cancelled = true;
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      // Swallow: if zxing.stop() throws, the stream-track cleanup below must still run
      // — otherwise the camera indicator stays on after unmount.
      try {
        zxingStop?.();
      } catch (err) {
        console.warn("barcode scanner: zxing stop failed", err);
      }
      if (video) {
        video.srcObject = null;
      }
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [status]);

  function submitManual() {
    const cleaned = manualValue.replace(/\D/g, "");
    if (!/^\d{8,14}$/.test(cleaned)) {
      setManualError("Enter 8–14 digits.");
      return;
    }
    setManualError(null);
    onDetectRef.current(cleaned);
  }

  if (status === "manual" || status === "error") {
    return (
      <div className={cn("flex flex-col gap-4", className)} data-testid="barcode-scanner-manual">
        {status === "error" && errorMessage && (
          <div className="rounded-md border border-tomato-2 bg-tomato-3 px-3 py-2 font-display text-sm text-tomato-2">
            {errorMessage}
          </div>
        )}
        <div>
          <label className="field-label">Barcode</label>
          <TextInput
            className="font-mono"
            inputMode="numeric"
            autoFocus
            placeholder="e.g. 8 014203 778124"
            value={manualValue}
            onChange={(e) => setManualValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submitManual();
              }
            }}
          />
          {manualError && (
            <div className="mt-1 font-display text-sm text-tomato-2">{manualError}</div>
          )}
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          {onCancel && (
            <Button variant="ghost" size="sm" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button variant="primary" size="sm" onClick={submitManual}>
            Look up
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-3", className)} data-testid="barcode-scanner">
      <div className="relative aspect-3/4 w-full overflow-hidden rounded-lg bg-ink-0 sm:aspect-video">
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          muted
          autoPlay
          playsInline
        />
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="h-1/3 w-4/5 rounded-md border-2 border-paper-0/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
        </div>
        <div className="absolute top-3 left-3 rounded-full bg-ink-0/60 px-2.5 py-1 font-mono text-2xs tracking-mono text-paper-0 uppercase">
          {status === "starting" ? "Starting camera…" : "Scanning…"}
        </div>
      </div>
      <div className="flex flex-wrap justify-between gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setStatus("manual");
            setErrorMessage(null);
          }}
        >
          Enter manually
        </Button>
        {onCancel && (
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}

export function BarcodeScannerSkeleton() {
  return (
    <div className="flex flex-col gap-3" data-testid="barcode-scanner-skeleton">
      <div className="aspect-3/4 w-full animate-pulse rounded-lg bg-paper-2 sm:aspect-video" />
      <div className="h-8 w-32 animate-pulse rounded-full bg-paper-2" />
    </div>
  );
}
