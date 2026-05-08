import type { IconProps } from "./types";

export function SearchIcon({ size = 16, className }: IconProps) {
  return (
    <svg viewBox="0 0 22 22" width={size} height={size} fill="none" className={className}>
      <circle cx="10" cy="10" r="6" stroke="currentColor" strokeWidth="1.3" />
      <path d="M14.5 14.5 L19 19" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}
