import { BlockSkeleton, TextSkeleton } from "@/components/skeleton";

export default function SearchLoading() {
  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-6 md:mb-12">
        <div>
          <TextSkeleton size="xs" w="9em" className="mb-3" />
          <TextSkeleton size="4xl" w="6em" className="lg:text-6xl" />
          <TextSkeleton size="md" w="18em" className="mt-3 sm:text-xl" />
        </div>
      </div>

      <BlockSkeleton className="mb-6 h-12 w-full rounded-full" />

      <div className="mb-6 flex flex-wrap gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <BlockSkeleton key={i} className="h-8 w-20 rounded-full" />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-md border border-paper-3 bg-paper-0 p-4"
          >
            <BlockSkeleton className="h-14 w-14 shrink-0 rounded-md" />
            <div className="min-w-0 flex-1">
              <TextSkeleton size="lg" w="70%" />
              <TextSkeleton size="xs" w="50%" className="mt-1" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
