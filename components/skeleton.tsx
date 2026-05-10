import { cva } from "class-variance-authority";
import { button } from "@/components/button";
import { cn } from "@/lib/cn";

const sizeClass = {
  "4xs": "text-4xs",
  "3xs": "text-3xs",
  "2xs": "text-2xs",
  xs: "text-xs",
  sm: "text-sm",
  base: "text-base",
  md: "text-md",
  lg: "text-lg",
  xl: "text-xl",
  "2xl": "text-2xl",
  "3xl": "text-3xl",
  "4xl": "text-4xl",
  "5xl": "text-5xl",
  "6xl": "text-6xl",
} as const;

export type TextSkeletonSize = keyof typeof sizeClass;

// A loading placeholder shaped like text. Wrapper takes one line-height per
// line so swapping in real text causes no layout shift.
export function TextSkeleton({
  size = "base",
  w = "60%",
  lines = 1,
  className,
}: {
  size?: TextSkeletonSize;
  w?: string;
  lines?: number;
  className?: string;
}) {
  return (
    <span aria-hidden className={cn("block", sizeClass[size], className)}>
      {Array.from({ length: lines }).map((_, i) => {
        const isLast = i === lines - 1;
        const lineWidth = isLast && lines > 1 ? `calc(${w} * 0.7)` : w;
        return (
          <span key={i} className="block">
            <span
              className="inline-block h-[0.7em] animate-pulse rounded-sm bg-paper-3 align-middle"
              style={{ width: lineWidth }}
            />
          </span>
        );
      })}
    </span>
  );
}

export function BlockSkeleton({ className, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div aria-hidden className={cn("animate-pulse rounded-md bg-paper-3", className)} {...rest} />
  );
}

// Pill-shaped placeholder that inherits the real button's padding/radius/text-size
// so its width auto-sizes to the (invisible) label inside - i.e. pass the same
// label the real button will have.
export function ButtonSkeleton({
  size,
  children,
  className,
}: {
  size?: "sm" | "md" | "lg";
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        button({ size }),
        "pointer-events-none animate-pulse cursor-default border-paper-3 bg-paper-3 text-paper-3",
        className,
      )}
    >
      <span className="invisible">{children ?? "."}</span>
    </span>
  );
}

// Square-ish placeholder for badges (rounded-sm, small text).
export const badgeSkeleton = cva("inline-flex animate-pulse items-center rounded-sm bg-paper-3", {
  variants: {
    size: {
      sm: "px-2 py-0.5 text-2xs",
      md: "px-2.5 py-1 text-xs",
    },
  },
  defaultVariants: { size: "sm" },
});

export function BadgeSkeleton({
  size,
  children,
  className,
}: {
  size?: "sm" | "md";
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <span aria-hidden className={cn(badgeSkeleton({ size }), className)}>
      <span className="invisible">{children ?? "."}</span>
    </span>
  );
}
