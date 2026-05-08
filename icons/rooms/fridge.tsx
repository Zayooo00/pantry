import type { IconProps } from "../types";

export function FridgeRoomIcon({ size = 22, className }: IconProps) {
  return (
    <svg viewBox="0 0 22 22" width={size} height={size} fill="none" className={className}>
      <rect x="5" y="3" width="12" height="18" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5 10 H17" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 6 V8 M8 13 V16" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}
