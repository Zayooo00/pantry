"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const getSnapshot = () => /Mac|iPhone|iPad|iPod/i.test(navigator.userAgent);
const getServerSnapshot = () => false;

export function useIsMac() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function ModKey() {
  const mac = useIsMac();
  return <>{mac ? "⌘" : "Ctrl"}</>;
}

export function Kbd({ keys }: { keys: string[] }) {
  const mac = useIsMac();
  const display = keys.map((k) => {
    if (k === "Mod") {
      return mac ? "⌘" : "Ctrl";
    }
    return k;
  });
  return (
    <span className="inline-flex items-center gap-0.5 font-mono text-2xs text-ink-4 border border-paper-4 px-1.5 py-0.5 rounded-sm bg-paper-0 leading-none">
      {display.map((d, i) => (
        <span key={i}>{d}</span>
      ))}
    </span>
  );
}
