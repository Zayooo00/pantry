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
      <div className="bg-paper-0 border border-ink-1 rounded-lg shadow-[0_24px_80px_rgba(0,0,0,0.18),0_4px_0_rgba(0,0,0,0.04)] overflow-hidden flex flex-col max-h-[92vh]">
        {title && (
          <div className="flex justify-between items-baseline px-6 py-5 border-b border-paper-3 gap-4">
            <h3 className="m-0 font-display font-normal text-xl tracking-[-0.01em] [&_em]:italic [&_em]:font-light">
              {title}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full border border-paper-4 bg-paper-0 text-ink-2 grid place-items-center cursor-pointer transition-all duration-150 ease-pantry hover:bg-ink-1 hover:text-paper-0 hover:border-ink-1"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        )}
        <div className="p-6 overflow-y-auto">{children}</div>
        {footer && (
          <div className="px-6 py-4 border-t border-paper-3 bg-paper-1 flex justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </dialog>
  );
}
