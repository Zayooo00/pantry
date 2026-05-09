import type { IconProps } from "./types";

export function ChevronIcon({ size = 16, className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} fill="none" className={className}>
      <path
        d="M4 6 L8 10 L12 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
