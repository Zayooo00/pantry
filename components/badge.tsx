import { cva } from "class-variance-authority";

export const badge = cva(
  "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm font-mono text-2xs tracking-label uppercase font-medium",
  {
    variants: {
      tone: {
        low: "bg-tomato-3 text-tomato-2",
        ok: "bg-olive-3 text-olive-2",
        soon: "bg-amber-pantry-3 text-amber-pantry-2",
        tag: "bg-paper-2 text-ink-2",
      },
    },
  },
);
