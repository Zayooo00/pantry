import { ButtonSkeleton, TextSkeleton } from "@/components/skeleton";

export default function NotificationsLoading() {
  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-6 md:mb-12">
        <div>
          <TextSkeleton size="xs" w="11em" className="mb-3" />
          <TextSkeleton size="3xl" w="11em" className="leading-none sm:text-4xl lg:text-6xl" />
          <TextSkeleton size="md" w="14em" className="mt-3 sm:text-xl" />
        </div>
        <div className="flex flex-wrap gap-2">
          <ButtonSkeleton>Mark all read</ButtonSkeleton>
          <ButtonSkeleton>Clear read</ButtonSkeleton>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <ButtonSkeleton size="sm">Unread (00)</ButtonSkeleton>
        <ButtonSkeleton size="sm">All (00)</ButtonSkeleton>
      </div>

      <div className="overflow-hidden rounded-xl border border-paper-3 bg-paper-0">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="block border-b border-dashed border-paper-3 px-4 py-4 last:border-0 sm:px-6"
          >
            <div className="mb-1 flex items-baseline gap-2">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-paper-3" aria-hidden />
              <TextSkeleton size="xs" w="6em" />
              <TextSkeleton size="2xs" w="6em" />
            </div>
            <TextSkeleton size="base" w="50%" className="sm:text-lg" />
            <TextSkeleton size="sm" w="80%" className="mt-1" />
          </div>
        ))}
      </div>
    </>
  );
}
