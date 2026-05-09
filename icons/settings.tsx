import type { IconProps } from "./types";

export function SettingsIcon({ size = 16, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 22 22"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      className={className}
    >
      <line x1="3.5" y1="6" x2="18.5" y2="6" />
      <line x1="3.5" y1="11" x2="18.5" y2="11" />
      <line x1="3.5" y1="16" x2="18.5" y2="16" />
      <circle cx="14" cy="6" r="2" fill="var(--color-paper-1, #f7f3ea)" />
      <circle cx="8" cy="11" r="2" fill="var(--color-paper-1, #f7f3ea)" />
      <circle cx="15" cy="16" r="2" fill="var(--color-paper-1, #f7f3ea)" />
    </svg>
  );
}
