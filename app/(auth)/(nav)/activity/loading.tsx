import { BlockSkeleton, TextSkeleton } from "@/components/skeleton";

export default function ActivityLoading() {
  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-6 md:mb-12">
        <div>
          <TextSkeleton size="xs" w="11em" className="mb-3" />
          <TextSkeleton size="3xl" w="6em" className="leading-none sm:text-4xl lg:text-6xl" />
          <TextSkeleton size="md" w="22em" className="mt-3 sm:text-xl" />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:items-end">
          <div className="w-full max-w-50">
            <TextSkeleton size="xs" w="3em" className="mb-2" />
            <BlockSkeleton className="h-9 w-full rounded-md" />
          </div>
          <div className="w-full max-w-50">
            <TextSkeleton size="xs" w="3em" className="mb-2" />
            <BlockSkeleton className="h-9 w-full rounded-md" />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-paper-3 bg-paper-1">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="grid grid-cols-[90px_1fr_60px] items-center gap-3 border-b border-dashed border-paper-3 px-4 py-3 last:border-0 md:grid-cols-[110px_1fr_140px_90px_70px] md:gap-4 md:px-6"
          >
            <TextSkeleton size="2xs" w="80%" />
            <span className="min-w-0">
              <TextSkeleton size="base" w="65%" />
              <TextSkeleton size="xs" w="55%" className="mt-0.5 md:hidden" />
            </span>
            <TextSkeleton size="xs" w="70%" className="hidden md:block" />
            <TextSkeleton size="sm" w="80%" className="hidden md:block" />
            <TextSkeleton size="sm" w="2.5em" className="text-right" />
          </div>
        ))}
      </div>

      <footer className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-paper-3 pt-6 md:mt-24">
        <TextSkeleton size="xs" w="11em" />
        <TextSkeleton size="xs" w="13em" />
      </footer>
    </>
  );
}
