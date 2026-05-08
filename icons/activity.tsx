import type { IconProps } from "./types";

export function ActivityIcon({ size = 16, className }: IconProps) {
  return (
    <svg viewBox="0 0 22 22" width={size} height={size} fill="none" className={className}>
      <circle cx="11" cy="11" r="7.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M11 6 V11 L14.5 13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
