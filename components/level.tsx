import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const levelStyles = cva("relative h-1.5 overflow-hidden rounded-full bg-paper-3", {
  variants: {
    tone: {
      ok: "",
      low: "",
      soon: "",
    },
  },
  defaultVariants: {
    tone: "ok",
  },
});

const fillTone = {
  ok: "bg-olive",
  low: "bg-tomato",
  soon: "bg-amber-pantry",
} as const;

type LevelProps = Omit<React.HTMLAttributes<HTMLDivElement>, "children"> &
  VariantProps<typeof levelStyles> & {
    value: number;
    fillClassName?: string;
  };

export const Level = forwardRef<HTMLDivElement, LevelProps>(function Level(
  { tone = "ok", value, className, fillClassName, ...rest },
  ref,
) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div ref={ref} className={cn(levelStyles({ tone }), className)} {...rest}>
      <i
        className={cn(
          "absolute top-0 bottom-0 left-0 rounded-full",
          fillClassName ?? fillTone[tone ?? "ok"],
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
});
