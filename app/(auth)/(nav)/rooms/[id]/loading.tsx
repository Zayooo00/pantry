import { BadgeSkeleton, BlockSkeleton, ButtonSkeleton, TextSkeleton } from "@/components/skeleton";

export default function RoomDetailLoading() {
  return (
    <>
      <nav className="mb-3 flex flex-wrap items-center gap-2 text-xs">
        <TextSkeleton size="xs" w="3em" />
        <span className="text-ink-3">/</span>
        <TextSkeleton size="xs" w="4em" />
        <span className="text-ink-3">/</span>
        <TextSkeleton size="xs" w="7em" />
      </nav>

      <div className="mb-8 flex flex-wrap items-end justify-between gap-6 md:mb-12">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <TextSkeleton size="xs" w="14em" />
            <BadgeSkeleton>OWNER</BadgeSkeleton>
          </div>
          <TextSkeleton size="3xl" w="9em" className="mt-2 leading-none sm:text-4xl lg:text-6xl" />
          <TextSkeleton size="md" w="6em" className="mt-3 sm:text-xl" />
        </div>
        <div className="flex flex-wrap gap-3">
          <ButtonSkeleton>Edit room</ButtonSkeleton>
          <ButtonSkeleton>Archive room</ButtonSkeleton>
          <ButtonSkeleton>Delete room</ButtonSkeleton>
          <ButtonSkeleton>＋ Add to room</ButtonSkeleton>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-8 rounded-xl border border-paper-3 bg-paper-1 p-5 md:p-8 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <TextSkeleton size="xs" w="9em" className="mb-3" />
          <div className="mb-6 flex flex-wrap items-center gap-6 md:gap-12">
            {[
              { num: "2em", label: "5em" },
              { num: "2em", label: "3em" },
              { num: "2em", label: "7em" },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-6 md:gap-12">
                {i > 0 && <div className="h-10 w-px bg-paper-3 sm:h-15" />}
                <div>
                  <TextSkeleton size="3xl" w={s.num} className="leading-none sm:text-5xl" />
                  <TextSkeleton size="xs" w={s.label} className="mt-1" />
                </div>
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
                <TextSkeleton size="2xs" w="80%" />
                <BlockSkeleton className="h-1.5 w-full rounded-full" />
                <TextSkeleton size="xs" w="2em" className="text-right" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
        <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto">
          <ButtonSkeleton size="sm">All</ButtonSkeleton>
          <ButtonSkeleton size="sm">Grains</ButtonSkeleton>
          <ButtonSkeleton size="sm">Canned</ButtonSkeleton>
          <ButtonSkeleton size="sm">Spices</ButtonSkeleton>
          <span className="mx-1.5 h-6 w-px bg-paper-3" />
          <ButtonSkeleton size="sm">Low only</ButtonSkeleton>
        </div>
        <div className="flex items-center gap-3 self-end lg:self-auto">
          <TextSkeleton size="xs" w="3em" className="hidden sm:block" />
          <BlockSkeleton className="hidden h-9 w-50 rounded-md sm:block" />
          <div className="inline-flex rounded-full border border-paper-3 bg-paper-1 p-0.75">
            <ButtonSkeleton size="sm" className="border-transparent bg-transparent">
              ▦ Grid
            </ButtonSkeleton>
            <ButtonSkeleton size="sm" className="border-transparent bg-transparent">
              ≡ List
            </ButtonSkeleton>
            <ButtonSkeleton size="sm" className="border-transparent bg-transparent">
              ⌂ Shelf
            </ButtonSkeleton>
          </div>
          <BlockSkeleton className="size-8 rounded-md sm:hidden" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col gap-3 overflow-hidden rounded-xl border border-paper-3 bg-paper-0 p-4"
          >
            <BlockSkeleton className="h-35 w-full rounded-md" />
            <TextSkeleton size="xs" w="60%" />
            <TextSkeleton size="xl" w="80%" className="leading-tight" />
            <div className="flex items-baseline justify-between border-t border-dashed border-paper-3 pt-3">
              <TextSkeleton size="2xl" w="3.5em" className="leading-none" />
              <BadgeSkeleton>OK</BadgeSkeleton>
            </div>
          </div>
        ))}
      </div>

      <footer className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-paper-3 pt-6 md:mt-24">
        <TextSkeleton size="xs" w="20em" />
        <TextSkeleton size="xs" w="14em" />
      </footer>
    </>
  );
}
