import type { IconProps } from "./types";

export function QrIcon({ size = 16, className }: IconProps) {
  return (
    <svg viewBox="0 0 22 22" width={size} height={size} fill="none" className={className}>
      <rect x="3" y="3" width="6" height="6" stroke="currentColor" strokeWidth="1.3" />
      <rect x="5" y="5" width="2" height="2" fill="currentColor" />
      <rect x="13" y="3" width="6" height="6" stroke="currentColor" strokeWidth="1.3" />
      <rect x="15" y="5" width="2" height="2" fill="currentColor" />
      <rect x="3" y="13" width="6" height="6" stroke="currentColor" strokeWidth="1.3" />
      <rect x="5" y="15" width="2" height="2" fill="currentColor" />
      <rect x="12" y="12" width="2" height="2" fill="currentColor" />
      <rect x="16" y="12" width="2" height="2" fill="currentColor" />
      <rect x="14" y="14" width="2" height="2" fill="currentColor" />
      <rect x="12" y="16" width="2" height="2" fill="currentColor" />
      <rect x="16" y="16" width="2" height="2" fill="currentColor" />
    </svg>
  );
}
