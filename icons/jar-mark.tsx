import type { IconProps } from "./types";

export function JarMark({ size = 22, className }: IconProps) {
  return (
    <svg viewBox="0 0 22 22" width={size} height={size} fill="none" className={className}>
      <rect x="3" y="5" width="16" height="14" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 11 H19" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="11" cy="15" r="1.2" fill="var(--color-olive)" />
    </svg>
  );
}
