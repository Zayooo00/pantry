import type { IconProps } from "../types";

export function FreezerRoomIcon({ size = 22, className }: IconProps) {
  return (
    <svg viewBox="0 0 22 22" width={size} height={size} fill="none" className={className}>
      <path d="M11 3 V19 M5 6 L17 16 M17 6 L5 16" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}
