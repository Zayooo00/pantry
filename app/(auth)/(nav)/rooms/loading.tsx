import { BadgeSkeleton, BlockSkeleton, ButtonSkeleton, TextSkeleton } from "@/components/skeleton";

export default function RoomsLoading() {
  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-6 md:mb-12">
        <div>
          <TextSkeleton size="xs" w="14em" />
          <TextSkeleton size="3xl" w="11em" className="mt-2 leading-none sm:text-4xl lg:text-6xl" />
          <TextSkeleton size="md" w="13em" className="mt-3 sm:text-xl" />
        </div>
        <div className="flex flex-wrap gap-3">
          <ButtonSkeleton>Reorder</ButtonSkeleton>
          <ButtonSkeleton>＋ New room</ButtonSkeleton>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2 sm:hidden">
        <ButtonSkeleton size="sm">All</ButtonSkeleton>
        <ButtonSkeleton size="sm">Indoor</ButtonSkeleton>
        <ButtonSkeleton size="sm">Cold storage</ButtonSkeleton>
        <ButtonSkeleton size="sm">Long-term</ButtonSkeleton>
        <ButtonSkeleton size="sm">Archived</ButtonSkeleton>
      </div>

      <div className="mb-6 hidden items-center gap-1 border-b border-paper-3 sm:flex md:mb-8">
        {["All", "Indoor", "Cold storage", "Long-term", "Archived"].map((label) => (
          <div
            key={label}
            className="-mb-px shrink-0 border-b-2 border-transparent px-3 py-2 md:px-4"
          >
            <TextSkeleton size="md" w={`${label.length * 0.55}em`} className="md:text-lg" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex min-h-70 flex-col gap-3 rounded-xl border border-paper-3 bg-paper-0 p-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BlockSkeleton className="h-7 w-7 rounded-sm" />
              </div>
              <div className="flex items-center gap-2">
                <TextSkeleton size="2xs" w="4em" />
              </div>
            </div>
            <TextSkeleton size="xs" w="11em" className="mt-3" />
            <TextSkeleton size="5xl" w="60%" className="mt-auto leading-none" />
            <BlockSkeleton className="mt-3 h-1 w-full rounded-full" />
            <div className="mt-3 flex items-baseline justify-between border-t border-dashed border-paper-3 pt-3">
              <TextSkeleton size="xs" w="5em" />
              <BadgeSkeleton>3 LOW</BadgeSkeleton>
            </div>
          </div>
        ))}
        <div className="grid min-h-70 place-items-center rounded-xl border-[1.5px] border-dashed border-paper-4 bg-transparent">
          <div className="text-center">
            <TextSkeleton size="4xl" w="1em" className="mx-auto leading-none" />
            <TextSkeleton size="2xl" w="9em" className="mx-auto mt-2" />
            <TextSkeleton size="xs" w="11em" className="mx-auto mt-2" />
          </div>
        </div>
      </div>

      <footer className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-paper-3 pt-6 md:mt-24">
        <TextSkeleton size="xs" w="16em" />
        <TextSkeleton size="xs" w="11em" />
      </footer>
    </>
  );
}
