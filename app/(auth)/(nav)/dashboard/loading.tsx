import { BadgeSkeleton, BlockSkeleton, ButtonSkeleton, TextSkeleton } from "@/components/skeleton";

export default function DashboardLoading() {
  return (
    <>
      <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
        <div>
          <TextSkeleton size="xs" w="14em" className="mb-3" />
          <TextSkeleton size="3xl" w="9em" className="leading-none sm:text-4xl lg:text-6xl" />
          <TextSkeleton size="3xl" w="6em" className="mt-1 leading-none sm:text-4xl lg:text-6xl" />
          <TextSkeleton size="md" w="14em" className="mt-3 sm:text-xl" />
        </div>
        <div className="flex flex-wrap gap-3">
          <ButtonSkeleton>Shopping list</ButtonSkeleton>
          <ButtonSkeleton>＋ Add item</ButtonSkeleton>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-paper-3 bg-paper-3 md:mb-12">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-paper-0 px-4 py-4 md:px-6 md:py-6">
            <TextSkeleton size="2xl" w="3em" className="leading-none md:text-3xl" />
            <TextSkeleton size="3xs" w="9em" className="mt-2 md:mt-3 md:text-xs" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
        <div>
          <div className="mb-4 flex items-baseline justify-between border-t border-ink-1 pt-3">
            <TextSkeleton size="2xl" w="11em" />
            <TextSkeleton size="xs" w="9em" />
          </div>

          <div className="overflow-hidden rounded-xl border border-paper-3 bg-paper-0">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="grid grid-cols-[56px_1fr_auto] items-center gap-3 border-b border-dashed border-paper-3 px-4 py-4 last:border-0 sm:grid-cols-[56px_1fr_auto_auto] sm:gap-4 sm:px-6"
              >
                <BlockSkeleton className="h-14 w-14" />
                <div className="min-w-0">
                  <TextSkeleton size="lg" w="60%" />
                  <TextSkeleton size="xs" w="40%" className="mt-0.5" />
                  <div className="mt-2 sm:hidden">
                    <div className="flex justify-between">
                      <TextSkeleton size="xs" w="6em" />
                      <TextSkeleton size="xs" w="3em" />
                    </div>
                    <BlockSkeleton className="mt-1.5 h-1.5 w-full rounded-full" />
                  </div>
                </div>
                <div className="hidden w-35 sm:block">
                  <div className="flex justify-between">
                    <TextSkeleton size="xs" w="6em" />
                    <TextSkeleton size="xs" w="3em" />
                  </div>
                  <BlockSkeleton className="mt-1.5 h-1.5 w-full rounded-full" />
                </div>
                <div className="flex items-center gap-2">
                  <BadgeSkeleton>LOW</BadgeSkeleton>
                  <ButtonSkeleton size="sm">＋ to list</ButtonSkeleton>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 mb-4 flex items-baseline justify-between border-t border-ink-1 pt-3">
            <TextSkeleton size="2xl" w="9em" />
            <TextSkeleton size="xs" w="8em" />
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex min-h-35 flex-col gap-3 rounded-md border border-paper-3 bg-paper-0 p-4"
              >
                <BadgeSkeleton>SOON</BadgeSkeleton>
                <div>
                  <TextSkeleton size="xl" w="80%" />
                  <TextSkeleton size="xl" w="55%" className="mt-1" />
                </div>
                <TextSkeleton size="xs" w="60%" className="mt-auto" />
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-4 flex items-baseline justify-between border-t border-ink-1 pt-3">
            <TextSkeleton size="2xl" w="6em" />
            <TextSkeleton size="xs" w="8em" />
          </div>

          <div className="rounded-xl border border-paper-3 bg-paper-1 p-4 md:p-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="grid grid-cols-[56px_1fr_auto] items-start gap-3 border-b border-dashed border-paper-3 py-3 last:border-0"
              >
                <TextSkeleton size="2xs" w="80%" />
                <div className="min-w-0">
                  <TextSkeleton size="base" w="80%" />
                  <TextSkeleton size="xs" w="55%" className="mt-0.5" />
                </div>
                <TextSkeleton size="sm" w="2em" />
              </div>
            ))}
          </div>

          <div className="mt-12 mb-4 flex items-baseline justify-between border-t border-ink-1 pt-3">
            <TextSkeleton size="2xl" w="13em" />
            <TextSkeleton size="xs" w="7em" />
          </div>

          <div className="flex flex-col gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-md border border-paper-3 bg-paper-0 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <BlockSkeleton className="h-4 w-4 rounded-sm" />
                  <TextSkeleton size="lg" w="6em" />
                </div>
                <BadgeSkeleton>3 LOW</BadgeSkeleton>
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-paper-3 pt-6 md:mt-24">
        <TextSkeleton size="xs" w="11em" />
        <TextSkeleton size="xs" w="8em" />
      </footer>
    </>
  );
}
