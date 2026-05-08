import type { IconProps } from "../types";

export function BasementRoomIcon({ size = 22, className }: IconProps) {
  return (
    <svg viewBox="0 0 22 22" width={size} height={size} fill="none" className={className}>
      <path d="M3 19 V8 L11 3 L19 8 V19 Z" stroke="currentColor" strokeWidth="1.3" />
      <rect x="9" y="13" width="4" height="6" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}
