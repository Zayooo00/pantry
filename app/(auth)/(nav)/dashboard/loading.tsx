import { BlockSkeleton, TextSkeleton } from "@/components/skeleton";

export default function DashboardLoading() {
  return (
    <>
      <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
        <div>
          <TextSkeleton size="xs" w="14em" className="mb-3" />
          <TextSkeleton size="4xl" w="8em" className="lg:text-6xl" />
          <TextSkeleton size="4xl" w="6em" className="mt-1 lg:text-6xl" />
          <TextSkeleton size="md" w="16em" className="mt-3 sm:text-xl" />
        </div>
        <div className="flex flex-wrap gap-3">
          <BlockSkeleton className="h-10 w-32" />
          <BlockSkeleton className="h-10 w-32" />
        </div>
      </div>

      <div className="mb-8 grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-paper-3 bg-paper-3 md:mb-12">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-paper-0 px-4 py-4 md:px-6 md:py-6">
            <TextSkeleton size="2xl" w="3em" className="md:text-3xl" />
            <TextSkeleton size="3xs" w="8em" className="mt-2 md:mt-3 md:text-xs" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
        <div>
          <TextSkeleton size="2xl" w="14em" className="mb-4" />
          <div className="overflow-hidden rounded-xl border border-paper-3 bg-paper-0">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="grid grid-cols-[56px_1fr_auto] items-center gap-3 border-b border-dashed border-paper-3 px-4 py-4 last:border-0 sm:px-6"
              >
                <BlockSkeleton className="h-14 w-14 rounded-md" />
                <div className="min-w-0">
                  <TextSkeleton size="lg" w="60%" />
                  <TextSkeleton size="xs" w="40%" className="mt-1" />
                </div>
                <BlockSkeleton className="h-7 w-20 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        <div>
          <TextSkeleton size="2xl" w="10em" className="mb-4" />
          <div className="rounded-xl border border-paper-3 bg-paper-1 p-4 md:p-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="grid grid-cols-[56px_1fr_auto] items-start gap-3 border-b border-dashed border-paper-3 py-3 last:border-0"
              >
                <TextSkeleton size="2xs" w="3em" />
                <div>
                  <TextSkeleton size="base" w="80%" />
                  <TextSkeleton size="xs" w="55%" className="mt-1" />
                </div>
                <TextSkeleton size="sm" w="2em" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
