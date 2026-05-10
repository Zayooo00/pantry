import { BlockSkeleton, TextSkeleton } from "@/components/skeleton";

export default function ShoppingLoading() {
  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-6 md:mb-12">
        <div>
          <TextSkeleton size="xs" w="14em" className="mb-3" />
          <TextSkeleton size="4xl" w="9em" className="lg:text-6xl" />
          <TextSkeleton size="md" w="16em" className="mt-3 sm:text-xl" />
        </div>
        <div className="flex flex-wrap gap-3">
          <BlockSkeleton className="h-10 w-32" />
          <BlockSkeleton className="h-10 w-36" />
        </div>
      </div>

      <BlockSkeleton className="mb-6 h-24 w-full rounded-xl" />

      <div className="grid gap-6">
        {Array.from({ length: 3 }).map((_, g) => (
          <div key={g}>
            <TextSkeleton size="xs" w="8em" className="mb-3" />
            <div className="overflow-hidden rounded-xl border border-paper-3 bg-paper-0">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 border-b border-dashed border-paper-3 px-4 py-3 last:border-0"
                >
                  <BlockSkeleton className="h-5 w-5 rounded-sm" />
                  <div className="min-w-0 flex-1">
                    <TextSkeleton size="base" w="55%" />
                    <TextSkeleton size="xs" w="35%" className="mt-1" />
                  </div>
                  <TextSkeleton size="sm" w="3em" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
