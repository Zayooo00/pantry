import { BlockSkeleton, TextSkeleton } from "@/components/skeleton";

export default function RoomsLoading() {
  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-6 md:mb-12">
        <div>
          <TextSkeleton size="xs" w="11em" />
          <TextSkeleton size="4xl" w="14em" className="mt-2 lg:text-6xl" />
          <TextSkeleton size="md" w="12em" className="mt-3 sm:text-xl" />
        </div>
        <div className="flex flex-wrap gap-3">
          <BlockSkeleton className="h-10 w-24" />
          <BlockSkeleton className="h-10 w-32" />
        </div>
      </div>

      <div className="mb-6 hidden items-center gap-1 border-b border-paper-3 sm:flex md:mb-8">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="px-3 py-2 md:px-4">
            <TextSkeleton size="md" w="5em" className="md:text-lg" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex min-h-70 flex-col gap-3 rounded-xl border border-paper-3 bg-paper-0 p-6"
          >
            <div className="flex items-center justify-between">
              <BlockSkeleton className="h-7 w-7 rounded-sm" />
              <TextSkeleton size="2xs" w="4em" />
            </div>
            <TextSkeleton size="xs" w="60%" className="mt-3" />
            <TextSkeleton size="5xl" w="60%" className="mt-auto" />
            <BlockSkeleton className="mt-3 h-1 w-full rounded-full" />
            <div className="mt-3 flex items-baseline justify-between border-t border-dashed border-paper-3 pt-3">
              <TextSkeleton size="xs" w="4em" />
              <TextSkeleton size="xs" w="3em" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
