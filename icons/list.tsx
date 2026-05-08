import type { IconProps } from "./types";

export function ListIcon({ size = 16, className }: IconProps) {
  return (
    <svg viewBox="0 0 22 22" width={size} height={size} fill="none" className={className}>
      <path d="M5 6 H17 M5 11 H17 M5 16 H17" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="3" cy="6" r="0.8" fill="currentColor" />
      <circle cx="3" cy="11" r="0.8" fill="currentColor" />
      <circle cx="3" cy="16" r="0.8" fill="currentColor" />
    </svg>
  );
}
