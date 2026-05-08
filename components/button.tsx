import { cva } from "class-variance-authority";

export const button = cva(
  "inline-flex items-center justify-center gap-2 rounded-full border border-transparent font-sans font-medium tracking-[0.01em] whitespace-nowrap no-underline transition-all duration-180 ease-pantry cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        primary: "bg-ink-1 text-paper-0 hover:bg-ink-0",
        secondary: "bg-transparent text-ink-1 border-ink-1 hover:bg-ink-1 hover:text-paper-0",
        ghost: "bg-transparent text-ink-2 border-paper-4 hover:bg-paper-2",
        olive: "bg-olive text-paper-0 hover:bg-olive-2",
        tomato: "bg-tomato text-paper-0 hover:bg-tomato-2",
      },
      size: {
        sm: "px-3 py-1.5 text-xs",
        md: "px-4.5 py-2.5 text-sm",
        lg: "px-6.5 py-3.5 text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);
