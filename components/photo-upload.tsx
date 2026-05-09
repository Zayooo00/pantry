"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { button } from "@/components/button";

export function PhotoUpload({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
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
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  function remove() {
    onChange(null);
    setError(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={onFile}
        className="hidden"
      />
      {value ? (
        <div className="flex gap-4 items-start">
          <div className="relative w-28 h-28 rounded-lg overflow-hidden border border-paper-3 bg-paper-1 shrink-0">
            <Image
              src={value}
              alt="Item photo"
              fill
              sizes="112px"
              className="object-cover"
            />
          </div>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              className={button({ variant: "ghost", size: "sm" })}
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? "Uploading…" : "Replace photo"}
            </button>
            <button
              type="button"
              className={button({ variant: "ghost", size: "sm" })}
              onClick={remove}
              disabled={uploading}
            >
              Remove photo
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className={cn(button({ variant: "secondary", size: "sm" }), uploading && "opacity-60")}
          >
            {uploading ? "Uploading…" : "Choose photo"}
          </button>
          <span className="font-mono text-xs tracking-mono uppercase text-ink-4">JPG / PNG / WEBP · UP TO 5MB</span>
        </div>
      )}
      {error && (
        <div className="text-tomato-2 font-display text-sm">{error}</div>
      )}
    </div>
  );
}
