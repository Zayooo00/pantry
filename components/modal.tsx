"use client";

import { useEffect, useRef } from "react";

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  width = 560,
}: {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: number;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dlg = ref.current;
    if (!dlg) {
      return;
    }
    if (open && !dlg.open) {
      dlg.showModal();
    }
    if (!open && dlg.open) {
      dlg.close();
    }
  }, [open]);

  function onBackdrop(e: React.MouseEvent<HTMLDialogElement>) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={onBackdrop}
      className="pantry-modal w-[95vw]"
      style={{ maxWidth: width }}
    >
      <div className="flex max-h-[92vh] flex-col overflow-hidden rounded-lg border border-ink-1 bg-paper-0 shadow-[0_24px_80px_rgba(0,0,0,0.18),0_4px_0_rgba(0,0,0,0.04)]">
        {title && (
          <div className="flex items-baseline justify-between gap-4 border-b border-paper-3 px-6 py-5">
            <h3 className="m-0 font-display text-xl font-normal tracking-display-sm [&_em]:font-light [&_em]:italic">
              {title}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="grid h-8 w-8 cursor-pointer place-items-center rounded-full border border-paper-4 bg-paper-0 text-ink-2 transition-all duration-150 ease-pantry hover:border-ink-1 hover:bg-ink-1 hover:text-paper-0"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        )}
        <div className="overflow-y-auto p-6">{children}</div>
        {footer && (
          <div className="flex justify-end gap-3 border-t border-paper-3 bg-paper-1 px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </dialog>
  );
}
