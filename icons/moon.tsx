import type { IconProps } from "./types";

export function MoonIcon({ size = 16, className }: IconProps) {
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
      <path d="M14.5 10.5 A6 6 0 0 1 7.5 3.5 A6.5 6.5 0 1 0 14.5 10.5 Z" />
    </svg>
  );
}
