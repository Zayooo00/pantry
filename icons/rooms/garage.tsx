import type { IconProps } from "../types";

export function GarageRoomIcon({ size = 22, className }: IconProps) {
  return (
    <svg viewBox="0 0 22 22" width={size} height={size} fill="none" className={className}>
      <path d="M3 19 V9 L11 4 L19 9 V19" stroke="currentColor" strokeWidth="1.3" />
      <rect x="6" y="12" width="10" height="7" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}
