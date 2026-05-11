import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const roleBadgeStyles = cva(
  "inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-3xs tracking-eyebrow-loose uppercase",
  {
    variants: {
      role: {
        owner: "border-ink-1 bg-ink-1 text-paper-0",
        editor: "border-paper-3 bg-paper-2 text-ink-1",
        viewer: "border-paper-3 bg-paper-1 text-ink-3",
      },
    },
  },
);

type RoleBadgeProps = React.HTMLAttributes<HTMLSpanElement> &
  Required<Pick<VariantProps<typeof roleBadgeStyles>, "role">>;

export const RoleBadge = forwardRef<HTMLSpanElement, RoleBadgeProps>(function RoleBadge(
  { role, className, ...rest },
  ref,
) {
  return <span ref={ref} className={cn(roleBadgeStyles({ role }), className)} {...rest} />;
});
