import type { IconProps } from "./types";

export function GridIcon({ size = 16, className }: IconProps) {
  return (
    <svg viewBox="0 0 22 22" width={size} height={size} fill="none" className={className}>
      <rect x="3" y="3" width="7" height="7" stroke="currentColor" strokeWidth="1.3" />
      <rect x="12" y="3" width="7" height="7" stroke="currentColor" strokeWidth="1.3" />
      <rect x="3" y="12" width="7" height="7" stroke="currentColor" strokeWidth="1.3" />
      <rect x="12" y="12" width="7" height="7" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}
