import { BlockSkeleton, TextSkeleton } from "@/components/skeleton";

export default function ActivityLoading() {
  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-6 md:mb-12">
        <div>
          <TextSkeleton size="xs" w="11em" className="mb-3" />
          <TextSkeleton size="4xl" w="6em" className="lg:text-6xl" />
          <TextSkeleton size="md" w="20em" className="mt-3 sm:text-xl" />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:items-end">
          <div className="w-50">
            <TextSkeleton size="xs" w="3em" className="mb-2" />
            <BlockSkeleton className="h-9 w-full" />
          </div>
          <div className="w-50">
            <TextSkeleton size="xs" w="3em" className="mb-2" />
            <BlockSkeleton className="h-9 w-full" />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-paper-3 bg-paper-1">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="grid grid-cols-[90px_1fr_60px] items-center gap-3 border-b border-dashed border-paper-3 px-4 py-3 last:border-0 md:grid-cols-[110px_1fr_140px_90px_70px] md:gap-4 md:px-6"
          >
            <TextSkeleton size="2xs" w="80%" />
            <TextSkeleton size="base" w="55%" />
            <TextSkeleton size="xs" w="60%" className="hidden md:block" />
            <TextSkeleton size="sm" w="60%" className="hidden md:block" />
            <TextSkeleton size="sm" w="2em" />
          </div>
        ))}
      </div>
    </>
  );
}
