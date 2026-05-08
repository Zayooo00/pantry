import { cva } from "class-variance-authority";

export const stamp = cva(
  "inline-flex items-center gap-1.5 px-2.5 py-1 border-[1.5px] border-ink-1 rounded-xs font-mono text-2xs tracking-[0.18em] uppercase text-ink-1 -rotate-[1.5deg] bg-paper-0",
  {
    variants: {
      tone: {
        default: "",
        tomato: "text-tomato-2 border-tomato-2",
        olive: "text-olive-2 border-olive-2",
      },
    },
    defaultVariants: {
      tone: "default",
    },
  },
);
