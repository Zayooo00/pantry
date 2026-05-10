import { BlockSkeleton, TextSkeleton } from "@/components/skeleton";

export default function NotificationsLoading() {
  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-6 md:mb-12">
        <div>
          <TextSkeleton size="xs" w="10em" className="mb-3" />
          <TextSkeleton size="4xl" w="10em" className="lg:text-6xl" />
          <TextSkeleton size="md" w="14em" className="mt-3 sm:text-xl" />
        </div>
        <div className="flex flex-wrap gap-3">
          <BlockSkeleton className="h-10 w-32" />
          <BlockSkeleton className="h-10 w-32" />
        </div>
      </div>

      <div className="mb-6 flex gap-2">
        <BlockSkeleton className="h-9 w-24 rounded-full" />
        <BlockSkeleton className="h-9 w-20 rounded-full" />
      </div>

      <div className="overflow-hidden rounded-xl border border-paper-3 bg-paper-0">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="grid grid-cols-[auto_1fr_auto] items-start gap-4 border-b border-dashed border-paper-3 px-4 py-4 last:border-0 md:px-6"
          >
            <BlockSkeleton className="h-7 w-20 rounded-full" />
            <div className="min-w-0">
              <TextSkeleton size="base" w="60%" />
              <TextSkeleton size="sm" w="80%" className="mt-1" />
            </div>
            <TextSkeleton size="2xs" w="6em" />
          </div>
        ))}
      </div>
    </>
  );
}
