export function BrandMark({ size = 32 }: { size?: number }) {
  const inner = Math.round(size * 0.55);
  return (
    <div
      className="grid place-items-center rounded-sm border-[1.5px] border-ink-1 bg-paper-0 text-ink-1"
      style={{ width: size, height: size }}
    >
      <svg width={inner} height={inner} viewBox="0 0 18 18" fill="none">
        <rect x="2" y="4" width="14" height="12" stroke="currentColor" strokeWidth="1.3" />
        <path d="M2 9 H16" stroke="currentColor" strokeWidth="1.3" />
        <circle cx="9" cy="12.5" r="1" fill="var(--color-olive)" />
      </svg>
    </div>
  );
}
