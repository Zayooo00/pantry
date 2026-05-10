import type { IconProps } from "../types";

export function PantryRoomIcon({ size = 22, className }: IconProps) {
  return (
    <svg viewBox="0 0 22 22" width={size} height={size} fill="none" className={className}>
      <rect x="2" y="4" width="18" height="14" stroke="currentColor" strokeWidth="1.3" />
      <path d="M2 11 H20 M11 4 V18" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}
