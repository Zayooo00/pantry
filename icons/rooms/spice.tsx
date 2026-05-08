import type { IconProps } from "../types";

export function SpiceRoomIcon({ size = 22, className }: IconProps) {
  return (
    <svg viewBox="0 0 22 22" width={size} height={size} fill="none" className={className}>
      <path d="M7 3 H15 V7 H7 Z" stroke="currentColor" strokeWidth="1.3" />
      <path d="M6 7 H16 V19 H6 Z" stroke="currentColor" strokeWidth="1.3" />
      <path d="M9 11 H13 M9 14 H13" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}
