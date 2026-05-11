"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Button } from "@/components/button";
import { cn } from "@/lib/cn";

export function PhotoUpload({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const galleryRef = useRef<HTMLInputElement | null>(null);
  const cameraRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        const message = typeof json?.error === "string" ? json.error : "Upload failed.";
        setError(message);
        return;
      }
      const json = (await res.json()) as { url: string };
      onChange(json.url);
    } catch {
      setError("Upload failed.");
    } finally {
      setUploading(false);
      if (galleryRef.current) {
        galleryRef.current.value = "";
      }
      if (cameraRef.current) {
        cameraRef.current.value = "";
      }
    }
  }

  function remove() {
    onChange(null);
    setError(null);
    if (galleryRef.current) {
      galleryRef.current.value = "";
    }
    if (cameraRef.current) {
      cameraRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <input ref={galleryRef} type="file" accept="image/*" onChange={onFile} className="hidden" />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onFile}
        className="hidden"
      />
      {value ? (
        <div className="flex items-start gap-4">
          <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-lg border border-paper-3 bg-paper-1">
            <Image
              src={value}
              alt="Item photo"
              fill
              sizes="112px"
              className="object-cover"
              unoptimized={value.startsWith("/api/photos/")}
            />
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                onClick={() => cameraRef.current?.click()}
                disabled={uploading}
              >
                Take photo
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => galleryRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? "Uploading…" : "Replace from files"}
              </Button>
            </div>
            <Button variant="ghost" size="sm" onClick={remove} disabled={uploading}>
              Remove photo
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            className={cn("md:hidden", uploading && "opacity-60")}
            onClick={() => cameraRef.current?.click()}
            disabled={uploading}
          >
            Take photo
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className={cn(uploading && "opacity-60")}
            onClick={() => galleryRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? "Uploading…" : "Choose photo"}
          </Button>
          <span className="font-mono text-xs tracking-mono text-ink-4 uppercase">
            JPG / PNG / WEBP · UP TO 5MB
          </span>
        </div>
      )}
      {error && <div className="font-display text-sm text-tomato-2">{error}</div>}
    </div>
  );
}
