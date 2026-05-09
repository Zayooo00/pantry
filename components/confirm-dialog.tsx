"use client";

import { useState } from "react";
import { Modal } from "./modal";
import { button } from "@/components/button";

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  variant = "default",
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  variant?: "default" | "danger";
}) {
  const [pending, setPending] = useState(false);

  async function handle() {
    setPending(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setPending(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className={button({ variant: "ghost" })}
            disabled={pending}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handle}
            className={
              variant === "danger" ? button({ variant: "tomato" }) : button({ variant: "primary" })
            }
            disabled={pending}
          >
            {pending ? "Working…" : confirmLabel}
          </button>
        </>
      }
    >
      <div className="font-display text-lg leading-relaxed text-ink-2 [&_em]:italic">{message}</div>
    </Modal>
  );
}
