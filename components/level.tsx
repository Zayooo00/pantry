import { cva } from "class-variance-authority";

export const level = cva(
  "relative h-1.5 bg-paper-3 rounded-full overflow-hidden [&>i]:absolute [&>i]:top-0 [&>i]:left-0 [&>i]:bottom-0 [&>i]:rounded-full",
  {
    variants: {
      tone: {
        ok: "[&>i]:bg-olive",
        low: "[&>i]:bg-tomato",
        soon: "[&>i]:bg-amber-pantry",
      },
    },
    defaultVariants: {
      tone: "ok",
    },
  },
);
