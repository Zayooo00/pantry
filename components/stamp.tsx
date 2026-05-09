import { cva } from "class-variance-authority";

export const stamp = cva(
  "inline-flex -rotate-[1.5deg] items-center gap-1.5 rounded-xs border-[1.5px] border-ink-1 bg-paper-0 px-2.5 py-1 font-mono text-2xs tracking-eyebrow-loose text-ink-1 uppercase",
  {
    variants: {
      tone: {
        default: "",
        tomato: "border-tomato-2 text-tomato-2",
        olive: "border-olive-2 text-olive-2",
      },
    },
    defaultVariants: {
      tone: "default",
    },
  },
);
