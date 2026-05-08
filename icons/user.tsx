import type { IconProps } from "./types";

export function UserIcon({ size = 22, className }: IconProps) {
  return (
    <svg viewBox="0 0 22 22" width={size} height={size} fill="none" className={className}>
      <circle cx="11" cy="9" r="3" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5 18 Q11 13 17 18" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}
