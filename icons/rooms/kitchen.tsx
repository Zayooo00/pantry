import type { IconProps } from "../types";

export function KitchenRoomIcon({ size = 22, className }: IconProps) {
  return (
    <svg viewBox="0 0 22 22" width={size} height={size} fill="none" className={className}>
      <rect x="3" y="6" width="16" height="13" stroke="currentColor" strokeWidth="1.3" />
      <path d="M3 11 H19" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="7" cy="9" r="0.8" fill="currentColor" />
      <circle cx="15" cy="9" r="0.8" fill="currentColor" />
    </svg>
  );
}
