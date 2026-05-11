import { forwardRef } from "react";
import { cn } from "@/lib/cn";

type Tone = "ok" | "low" | "soon";

const fillTone: Record<Tone, string> = {
  ok: "bg-olive",
  low: "bg-tomato",
  soon: "bg-amber-pantry",
};

type LevelProps = Omit<React.HTMLAttributes<HTMLDivElement>, "children"> & {
  tone?: Tone;
  value: number;
  fillClassName?: string;
};

export const Level = forwardRef<HTMLDivElement, LevelProps>(function Level(
  { tone = "ok", value, className, fillClassName, ...rest },
  ref,
) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      ref={ref}
      className={cn("relative h-1.5 overflow-hidden rounded-full bg-paper-3", className)}
      {...rest}
    >
      <i
        className={cn(
          "absolute top-0 bottom-0 left-0 rounded-full",
          fillClassName ?? fillTone[tone],
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
});
