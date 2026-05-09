"use client";

import { createContext, useCallback, useContext, useState } from "react";

type ToastItem = { id: number; message: React.ReactNode };
type Ctx = { toast: (msg: React.ReactNode) => void };

const ToastContext = createContext<Ctx>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const toast = useCallback((message: React.ReactNode) => {
    const id = Date.now() + Math.random();
    setItems((s) => [...s, { id, message }]);
    setTimeout(() => {
      setItems((s) => s.filter((x) => x.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed right-6 bottom-6 z-100 flex flex-col gap-2">
        {items.map((it) => (
          <div
            key={it.id}
            className="animate-[pantry-pop_0.25s_var(--ease-pantry)] rounded-full bg-ink-1 px-5 py-3 font-display text-base text-paper-0 shadow-[0_12px_32px_rgba(0,0,0,0.2)] [&_em]:text-amber-pantry-3 [&_em]:italic"
          >
            {it.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
