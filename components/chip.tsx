import { cva } from "class-variance-authority";

// Variants own their full color set so Tailwind doesn't rely on declaration
// order to resolve bg/text/border conflicts; otherwise active chips can render
// with cream text on a cream background depending on stylesheet order.
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
