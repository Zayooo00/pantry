import { cva } from "class-variance-authority";

export const chip = cva(
  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-sans cursor-pointer transition-all duration-150 ease-pantry",
  {
    variants: {
      active: {
        true: "bg-ink-1 text-paper-0 border-ink-1 hover:bg-ink-0 hover:border-ink-0",
        false: "bg-paper-0 text-ink-2 border-paper-4 hover:border-ink-2",
      },
    },
    defaultVariants: {
      active: false,
    },
  },
);
