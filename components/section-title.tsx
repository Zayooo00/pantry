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
        "mt-12 mb-4 flex items-baseline justify-between border-t border-ink-1 pt-3 [&_h2]:m-0 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-normal [&_h2]:tracking-display-sm [&_h2_em]:font-light [&_h2_em]:italic",
        className,
      )}
    >
      {children}
    </div>
  );
}
