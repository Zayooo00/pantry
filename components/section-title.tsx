import { cn } from "@/lib/cn";

export function SectionTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-baseline justify-between border-t border-ink-1 pt-3 mt-12 mb-4 [&_h2]:font-display [&_h2]:font-normal [&_h2]:text-2xl [&_h2]:m-0 [&_h2]:tracking-display-sm [&_h2_em]:italic [&_h2_em]:font-light",
        className,
      )}
    >
      {children}
    </div>
  );
}
