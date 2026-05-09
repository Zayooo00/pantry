import type { IconProps } from "./types";

export function SunIcon({ size = 16, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 18 18"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      className={className}
    >
      <circle cx="9" cy="9" r="3.2" />
      <path d="M9 1.5 V3 M9 15 V16.5 M1.5 9 H3 M15 9 H16.5 M3.6 3.6 L4.7 4.7 M13.3 13.3 L14.4 14.4 M3.6 14.4 L4.7 13.3 M13.3 4.7 L14.4 3.6" />
    </svg>
  );
}
