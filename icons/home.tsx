import type { IconProps } from "./types";

export function HomeIcon({ size = 16, className }: IconProps) {
  return (
    <svg viewBox="0 0 22 22" width={size} height={size} fill="none" className={className}>
      <path d="M3 11 L11 4 L19 11 V19 H3 Z" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}
