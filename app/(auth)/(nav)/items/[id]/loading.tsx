import { BlockSkeleton, ButtonSkeleton, TextSkeleton } from "@/components/skeleton";

export default function ItemDetailLoading() {
  return (
    <>
      <nav className="mb-6 flex flex-wrap items-center gap-2 text-xs">
        <TextSkeleton size="xs" w="3em" />
        <span className="text-ink-3">/</span>
        <TextSkeleton size="xs" w="4em" />
        <span className="text-ink-3">/</span>
        <TextSkeleton size="xs" w="6em" />
        <span className="text-ink-3">/</span>
        <TextSkeleton size="xs" w="9em" />
      </nav>

      <div className="mb-8 grid grid-cols-1 gap-8 md:mb-12 md:gap-12 lg:grid-cols-[420px_1fr]">
        <div>
          <BlockSkeleton className="aspect-4/5 w-full rounded-xl" />
          <TextSkeleton size="xs" w="20em" className="mt-6" />
        </div>
        <div>
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-paper-3 pb-6 md:gap-6">
            <div>
              <TextSkeleton size="xs" w="14em" className="mb-3" />
              <TextSkeleton size="3xl" w="9em" className="leading-[0.95] sm:text-4xl lg:text-6xl" />
              <TextSkeleton
                size="3xl"
                w="6em"
                className="mt-1 leading-[0.95] sm:text-4xl lg:text-6xl"
              />
            </div>
            <div className="flex gap-2">
              <ButtonSkeleton size="sm">Edit</ButtonSkeleton>
              <ButtonSkeleton size="sm">Move</ButtonSkeleton>
              <ButtonSkeleton size="sm">Delete</ButtonSkeleton>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-1 items-center gap-6 rounded-xl border border-olive-2 bg-olive-3 p-5 md:grid-cols-[auto_1fr] md:gap-12 md:p-8">
            <div>
              <TextSkeleton size="2xs" w="11em" className="mb-1" />
              <TextSkeleton size="6xl" w="6em" className="leading-none md:text-[96px]" />
              <TextSkeleton size="xl" w="14em" className="mt-2" />
            </div>
            <div className="flex flex-col gap-3 md:items-end">
              <BlockSkeleton className="h-14 w-44 rounded-full border-2 border-ink-1" />
              <div className="flex flex-wrap gap-2 md:justify-end">
                <ButtonSkeleton size="sm">Mark opened</ButtonSkeleton>
                <ButtonSkeleton size="sm">＋ Shopping list</ButtonSkeleton>
              </div>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-paper-3 bg-paper-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-paper-0 px-6 py-4">
                <TextSkeleton size="xs" w="6em" className="mb-1" />
                <TextSkeleton size="lg" w="8em" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-12 mb-4 flex items-baseline justify-between border-t border-ink-1 pt-3">
        <TextSkeleton size="2xl" w="6em" />
        <TextSkeleton size="xs" w="6em" />
      </div>
      <div className="rounded-xl border border-paper-3 bg-paper-1 p-4 md:p-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="grid grid-cols-[90px_1fr_60px] items-center gap-3 border-b border-dashed border-paper-3 px-2 py-3 last:border-0 sm:grid-cols-[120px_1fr_80px_80px] sm:gap-4"
          >
            <TextSkeleton size="2xs" w="80%" />
            <TextSkeleton size="sm" w="70%" />
            <TextSkeleton size="sm" w="3em" className="text-right sm:text-left" />
            <TextSkeleton size="xs" w="5em" className="hidden sm:block" />
          </div>
        ))}
      </div>

      <footer className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-paper-3 pt-6 md:mt-24">
        <TextSkeleton size="xs" w="22em" />
        <TextSkeleton size="xs" w="9em" />
      </footer>
    </>
  );
}
