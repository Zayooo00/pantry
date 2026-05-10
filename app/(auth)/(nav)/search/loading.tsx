import { BadgeSkeleton, BlockSkeleton, ButtonSkeleton, TextSkeleton } from "@/components/skeleton";

export default function SearchLoading() {
  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-6 md:mb-12">
        <div>
          <TextSkeleton size="xs" w="20em" />
          <TextSkeleton size="3xl" w="9em" className="mt-2 leading-none sm:text-4xl lg:text-6xl" />
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 items-center gap-4 rounded-xl border border-paper-3 bg-paper-0 px-5 py-4 md:grid-cols-[1fr_auto] md:gap-6 md:px-8 md:py-6">
        <TextSkeleton size="xl" w="22em" className="leading-tight sm:text-2xl lg:text-4xl" />
        <div className="flex items-center gap-3">
          <TextSkeleton size="xs" w="6em" />
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2 lg:hidden">
        <ButtonSkeleton size="sm">All</ButtonSkeleton>
        <ButtonSkeleton size="sm">Low (00)</ButtonSkeleton>
        <ButtonSkeleton size="sm">Expiring (00)</ButtonSkeleton>
      </div>

      <div className="mb-6 hidden flex-wrap items-center gap-2 lg:flex">
        <ButtonSkeleton size="sm">All rooms</ButtonSkeleton>
        <ButtonSkeleton size="sm">Pantry</ButtonSkeleton>
        <ButtonSkeleton size="sm">Kitchen</ButtonSkeleton>
        <ButtonSkeleton size="sm">Fridge</ButtonSkeleton>
        <ButtonSkeleton size="sm">Freezer</ButtonSkeleton>
        <span className="mx-1.5 h-6 w-px bg-paper-3" />
        <ButtonSkeleton size="sm">All status</ButtonSkeleton>
        <ButtonSkeleton size="sm">Low only</ButtonSkeleton>
        <ButtonSkeleton size="sm">Expiring</ButtonSkeleton>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_280px] lg:gap-12">
        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-paper-3 py-3">
            <TextSkeleton size="lg" w="9em" className="md:text-xl" />
            <TextSkeleton size="xs" w="13em" className="hidden sm:block" />
          </div>

          <div className="overflow-hidden rounded-xl border border-paper-3 bg-paper-0">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="grid grid-cols-[56px_1fr_auto] items-center gap-3 border-b border-dashed border-paper-3 px-4 py-4 last:border-0 sm:grid-cols-[56px_2fr_1fr_100px_80px] sm:gap-4 sm:px-6"
              >
                <BlockSkeleton className="h-14 w-14" />
                <div className="min-w-0">
                  <TextSkeleton size="lg" w="60%" />
                  <TextSkeleton size="xs" w="45%" className="mt-0.5" />
                  <div className="mt-1.5 sm:hidden">
                    <TextSkeleton size="xs" w="6em" />
                    <BlockSkeleton className="mt-1 h-1.5 w-full rounded-full" />
                  </div>
                </div>
                <div className="hidden sm:block">
                  <TextSkeleton size="xs" w="5em" />
                  <BlockSkeleton className="mt-1 h-1.5 w-full rounded-full" />
                </div>
                <div className="hidden sm:flex sm:items-center">
                  <BadgeSkeleton>OK</BadgeSkeleton>
                </div>
                <div className="hidden sm:flex sm:items-center">
                  <ButtonSkeleton size="sm">View</ButtonSkeleton>
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="hidden lg:block">
          {[
            { title: "5em", rows: 5 },
            { title: "5em", rows: 3 },
            { title: "7em", rows: 4 },
          ].map((facet, fi) => (
            <div key={fi} className="mb-4 rounded-xl border border-paper-3 bg-paper-1 p-4">
              <TextSkeleton size="md" w={facet.title} className="mb-3 tracking-display-sm" />
              {Array.from({ length: facet.rows }).map((_, i) => (
                <div key={i} className="flex items-center justify-between py-1.5">
                  <span className="flex items-center gap-2">
                    <BlockSkeleton className="h-4.5 w-4.5 rounded-sm" />
                    <TextSkeleton size="sm" w="7em" />
                  </span>
                  <TextSkeleton size="xs" w="2em" />
                </div>
              ))}
            </div>
          ))}
        </aside>
      </div>

      <footer className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-paper-3 pt-6 md:mt-24">
        <TextSkeleton size="xs" w="20em" />
        <TextSkeleton size="xs" w="14em" />
      </footer>
    </>
  );
}
