import type { IconProps } from "./types";

export function ScanIcon({ size = 16, className }: IconProps) {
  return (
    <svg viewBox="0 0 22 22" width={size} height={size} fill="none" className={className}>
      <path
        d="M3 7V4h3M19 7V4h-3M3 15v3h3M19 15v3h-3"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path d="M6 8v6M9 8v6M12 8v6M14 8v6M17 8v6" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}
