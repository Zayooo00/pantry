import { useId } from "react";

export function ShelfBoardTexture({ className }: { className?: string }) {
  const id = useId();
  return (
    <svg
      aria-hidden
      preserveAspectRatio="none"
      className={className}
      width="100%"
      height="100%"
    >
      <defs>
        <pattern id={id} width="240" height="14" patternUnits="userSpaceOnUse">
          <line x1="0" y1="2.5" x2="240" y2="2.5" stroke="black" strokeOpacity="0.18" strokeWidth="0.6" />
          <line x1="0" y1="5.5" x2="240" y2="5.5" stroke="black" strokeOpacity="0.12" strokeWidth="0.5" />
          <line x1="0" y1="8.5" x2="240" y2="8.5" stroke="black" strokeOpacity="0.14" strokeWidth="0.4" />
          <line x1="0" y1="11.5" x2="240" y2="11.5" stroke="black" strokeOpacity="0.10" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

export function ShelfWallTexture({ className }: { className?: string }) {
  const id = useId();
  return (
    <svg
      aria-hidden
      preserveAspectRatio="none"
      className={className}
      width="100%"
      height="100%"
    >
      <defs>
        <pattern id={id} width="180" height="180" patternUnits="userSpaceOnUse">
          <line x1="60" y1="0" x2="60" y2="180" stroke="black" strokeOpacity="0.16" strokeWidth="1" />
          <line x1="120" y1="0" x2="120" y2="180" stroke="black" strokeOpacity="0.16" strokeWidth="1" />
          <line x1="18" y1="0" x2="18" y2="180" stroke="black" strokeOpacity="0.06" strokeWidth="0.5" />
          <line x1="38" y1="0" x2="38" y2="180" stroke="black" strokeOpacity="0.04" strokeWidth="0.4" />
          <line x1="80" y1="0" x2="80" y2="180" stroke="black" strokeOpacity="0.05" strokeWidth="0.4" />
          <line x1="100" y1="0" x2="100" y2="180" stroke="black" strokeOpacity="0.07" strokeWidth="0.5" />
          <line x1="142" y1="0" x2="142" y2="180" stroke="black" strokeOpacity="0.05" strokeWidth="0.4" />
          <line x1="160" y1="0" x2="160" y2="180" stroke="black" strokeOpacity="0.06" strokeWidth="0.5" />
          <ellipse cx="30" cy="62" rx="3" ry="5" fill="black" fillOpacity="0.10" />
          <ellipse cx="90" cy="130" rx="3.5" ry="5.5" fill="black" fillOpacity="0.09" />
          <ellipse cx="150" cy="40" rx="2.5" ry="4" fill="black" fillOpacity="0.10" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}
