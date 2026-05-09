import { cva } from "class-variance-authority";

export const button = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border font-sans font-medium tracking-[0.01em] whitespace-nowrap no-underline transition-all duration-180 ease-pantry disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "border-transparent bg-ink-1 text-paper-0 hover:bg-ink-0",
        secondary: "border-ink-1 bg-transparent text-ink-1 hover:bg-ink-1 hover:text-paper-0",
        ghost: "border-paper-4 bg-transparent text-ink-2 hover:bg-paper-2",
        olive: "border-transparent bg-olive text-paper-0 hover:bg-olive-2",
        tomato: "border-transparent bg-tomato text-paper-0 hover:bg-tomato-2",
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
