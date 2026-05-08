import type { IconProps } from "./types";

export function SettingsIcon({ size = 16, className }: IconProps) {
  return (
    <svg viewBox="0 0 22 22" width={size} height={size} fill="none" className={className}>
      <circle cx="11" cy="11" r="3" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M11 2 V5 M11 17 V20 M2 11 H5 M17 11 H20 M5 5 L7 7 M15 15 L17 17 M5 17 L7 15 M15 7 L17 5"
        stroke="currentColor"
        strokeWidth="1.3"
      />
    </svg>
  );
}
