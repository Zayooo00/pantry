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
    <span className="kbd">
      {display.map((d, i) => (
        <span key={i}>{d}</span>
      ))}
    </span>
  );
}
