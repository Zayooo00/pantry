import { BlockSkeleton, TextSkeleton } from "@/components/skeleton";

export default function ItemDetailLoading() {
  return (
    <>
      <nav className="mb-6 flex flex-wrap items-center gap-2 text-xs">
        <TextSkeleton size="xs" w="3em" />
        <TextSkeleton size="xs" w="0.5em" />
        <TextSkeleton size="xs" w="4em" />
        <TextSkeleton size="xs" w="0.5em" />
        <TextSkeleton size="xs" w="5em" />
        <TextSkeleton size="xs" w="0.5em" />
        <TextSkeleton size="xs" w="7em" />
      </nav>

      <div className="mb-8 grid grid-cols-1 gap-8 md:mb-12 md:gap-12 lg:grid-cols-[420px_1fr]">
        <div>
          <BlockSkeleton className="aspect-4/5 w-full rounded-xl" />
          <TextSkeleton size="xs" w="14em" className="mt-6" />
        </div>
        <div>
          <div className="mb-6 border-b border-paper-3 pb-6">
            <TextSkeleton size="xs" w="14em" className="mb-3" />
            <TextSkeleton size="4xl" w="9em" className="lg:text-6xl" />
            <TextSkeleton size="4xl" w="6em" className="mt-1 lg:text-6xl" />
          </div>

          <div className="mb-6 grid grid-cols-1 items-center gap-6 rounded-xl border border-olive-2 bg-olive-3 p-5 md:grid-cols-[auto_1fr] md:gap-12 md:p-8">
            <div>
              <TextSkeleton size="2xs" w="11em" className="mb-1" />
              <TextSkeleton size="6xl" w="6em" />
              <TextSkeleton size="xl" w="14em" className="mt-2" />
            </div>
            <div className="flex flex-col gap-3 md:items-end">
              <BlockSkeleton className="h-12 w-44 rounded-full" />
              <div className="flex flex-wrap gap-2 md:justify-end">
                <BlockSkeleton className="h-9 w-32" />
                <BlockSkeleton className="h-9 w-36" />
              </div>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-paper-3 bg-paper-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-paper-0 px-6 py-4">
                <TextSkeleton size="xs" w="6em" className="mb-1" />
                <TextSkeleton size="lg" w="60%" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <TextSkeleton size="2xl" w="6em" className="mb-4" />
      <div className="rounded-xl border border-paper-3 bg-paper-1 p-4 md:p-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="grid grid-cols-[90px_1fr_60px] items-center gap-3 border-b border-dashed border-paper-3 py-3 last:border-0 sm:grid-cols-[120px_1fr_80px_80px] sm:gap-4"
          >
            <TextSkeleton size="2xs" w="80%" />
            <TextSkeleton size="sm" w="60%" />
            <TextSkeleton size="sm" w="2em" />
            <TextSkeleton size="xs" w="4em" className="hidden sm:block" />
          </div>
        ))}
      </div>
    </>
  );
}
