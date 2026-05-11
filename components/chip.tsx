import { forwardRef } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const chipStyles = cva(
  "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 font-sans text-xs transition-all duration-150 ease-pantry",
  {
    variants: {
      active: {
        true: "border-ink-1 bg-ink-1 text-paper-0 hover:border-ink-0 hover:bg-ink-0",
        false: "border-paper-4 bg-paper-0 text-ink-2 hover:border-ink-2",
      },
    },
    defaultVariants: {
      active: false,
    },
  },
);

type ChipProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof chipStyles> & {
    asChild?: boolean;
  };

export const Chip = forwardRef<HTMLButtonElement, ChipProps>(function Chip(
  { active, asChild, className, type, ...rest },
  ref,
) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      ref={ref}
      type={asChild ? undefined : (type ?? "button")}
      className={cn(chipStyles({ active }), className)}
      {...rest}
    />
  );
});
