import { BlockSkeleton, TextSkeleton } from "@/components/skeleton";

export default function RoomDetailLoading() {
  return (
    <>
      <nav className="mb-3 flex flex-wrap items-center gap-2 text-xs">
        <TextSkeleton size="xs" w="3em" />
        <TextSkeleton size="xs" w="0.5em" />
        <TextSkeleton size="xs" w="4em" />
        <TextSkeleton size="xs" w="0.5em" />
        <TextSkeleton size="xs" w="6em" />
      </nav>

      <div className="mb-8 flex flex-wrap items-end justify-between gap-6 md:mb-12">
        <div>
          <TextSkeleton size="xs" w="10em" className="mb-3" />
          <TextSkeleton size="4xl" w="10em" className="lg:text-6xl" />
          <TextSkeleton size="md" w="14em" className="mt-3 sm:text-xl" />
        </div>
        <BlockSkeleton className="h-10 w-32" />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-8 rounded-xl border border-paper-3 bg-paper-1 p-5 md:p-8 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <TextSkeleton size="xs" w="9em" className="mb-3" />
          <div className="flex flex-wrap items-center gap-6 md:gap-12">
            {[0, 1, 2].map((i) => (
              <div key={i}>
                <TextSkeleton size="3xl" w="2em" className="sm:text-5xl" />
                <TextSkeleton size="xs" w="4em" className="mt-1" />
              </div>
            ))}
          </div>
        </div>
        <div>
          <TextSkeleton size="xs" w="8em" className="mb-3" />
          <div className="grid gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="grid grid-cols-[80px_1fr_40px] items-center gap-3 sm:grid-cols-[100px_1fr_60px]"
              >
                <TextSkeleton size="2xs" w="60%" />
                <BlockSkeleton className="h-2 w-full rounded-full" />
                <TextSkeleton size="xs" w="2em" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-paper-3 bg-paper-0">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="grid grid-cols-[56px_1fr_auto] items-center gap-3 border-b border-dashed border-paper-3 px-4 py-4 last:border-0 sm:px-6"
          >
            <BlockSkeleton className="h-14 w-14 rounded-md" />
            <div className="min-w-0">
              <TextSkeleton size="lg" w="55%" />
              <TextSkeleton size="xs" w="35%" className="mt-1" />
            </div>
            <BlockSkeleton className="h-7 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </>
  );
}
