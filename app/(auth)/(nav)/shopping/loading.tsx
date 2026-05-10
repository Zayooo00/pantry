import { BlockSkeleton, ButtonSkeleton, TextSkeleton } from "@/components/skeleton";

export default function ShoppingLoading() {
  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-6 md:mb-12">
        <div>
          <TextSkeleton size="xs" w="22em" />
          <TextSkeleton size="3xl" w="9em" className="mt-2 leading-none sm:text-4xl lg:text-6xl" />
          <TextSkeleton size="md" w="14em" className="mt-3 sm:text-xl" />
        </div>
        <div className="flex flex-wrap gap-3">
          <ButtonSkeleton>Print</ButtonSkeleton>
          <ButtonSkeleton>Export</ButtonSkeleton>
          <ButtonSkeleton>Mark trip complete</ButtonSkeleton>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <ButtonSkeleton size="sm">All (00)</ButtonSkeleton>
          <ButtonSkeleton size="sm">Outstanding (00)</ButtonSkeleton>
        </div>
        <TextSkeleton size="xs" w="14em" />
      </div>

      <div className="mx-auto mb-6 grid max-w-180 grid-cols-1 gap-2 rounded-md border border-paper-3 bg-paper-1 px-3 py-3 sm:grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end lg:grid-cols-[minmax(160px,1fr)_auto_88px_128px_auto]">
        <div className="sm:col-span-4 sm:mb-1 lg:col-span-5">
          <TextSkeleton size="xs" w="13em" />
        </div>
        <div className="sm:col-span-4 lg:col-span-1">
          <BlockSkeleton className="h-12 w-full rounded-md" />
        </div>
        <BlockSkeleton className="h-12 w-full rounded-md sm:w-26" />
        <BlockSkeleton className="h-12 w-full rounded-md" />
        <BlockSkeleton className="h-12 w-full rounded-md" />
        <ButtonSkeleton className="w-full sm:w-auto">＋ Add</ButtonSkeleton>
      </div>

      <div className="relative mx-auto max-w-180 rounded-xl border border-paper-3 bg-paper-0 px-5 py-6 md:px-12 md:py-12">
        <div className="absolute top-4 right-4 hidden sm:block md:top-6 md:right-8">
          <BlockSkeleton className="h-7 w-22 rounded-sm" />
        </div>
        <div className="mb-6 border-b-[1.5px] border-ink-1 pb-4 text-center">
          <TextSkeleton size="xs" w="14em" className="mx-auto mb-2" />
          <TextSkeleton size="2xl" w="9em" className="mx-auto leading-none md:text-4xl" />
          <TextSkeleton size="2xs" w="14em" className="mx-auto mt-3" />
        </div>

        {Array.from({ length: 3 }).map((_, g) => (
          <div key={g} className="mb-6">
            <div className="mb-2 flex justify-between border-b border-dashed border-paper-4 pb-1.5">
              <TextSkeleton size="lg" w="6em" />
              <TextSkeleton size="2xs" w="5em" />
            </div>
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="grid grid-cols-[24px_1fr_auto] items-center gap-2 border-b border-dotted border-paper-3 py-2 last:border-0 sm:grid-cols-[28px_1fr_auto_auto] sm:gap-3"
              >
                <BlockSkeleton className="h-4.5 w-4.5 rounded-sm" />
                <div className="min-w-0">
                  <TextSkeleton size="md" w="60%" className="sm:text-lg" />
                  <TextSkeleton size="2xs" w="35%" />
                </div>
                <TextSkeleton size="sm" w="5em" />
                <TextSkeleton size="sm" w="3em" className="hidden text-right sm:block" />
              </div>
            ))}
          </div>
        ))}

        <div className="mt-6 flex items-baseline justify-between border-t-[1.5px] border-ink-1 pt-4">
          <TextSkeleton size="2xs" w="22em" />
          <TextSkeleton size="3xl" w="4em" className="leading-none" />
        </div>

        <TextSkeleton size="xs" w="22em" className="mx-auto mt-6 text-center" />
      </div>

      <footer className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-paper-3 pt-6 md:mt-24">
        <TextSkeleton size="xs" w="6em" />
        <TextSkeleton size="xs" w="9em" />
      </footer>
    </>
  );
}
