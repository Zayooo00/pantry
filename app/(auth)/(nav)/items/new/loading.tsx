import { BlockSkeleton, TextSkeleton } from "@/components/skeleton";

export default function NewItemLoading() {
  return (
    <div className="mx-auto max-w-3xl">
      <TextSkeleton size="xs" w="9em" className="mb-3" />
      <TextSkeleton size="4xl" w="8em" className="lg:text-6xl" />
      <TextSkeleton size="md" w="18em" className="mt-3 sm:text-xl" />

      <div className="mt-8 grid gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i}>
            <TextSkeleton size="xs" w="6em" className="mb-2" />
            <BlockSkeleton className="h-10 w-full" />
          </div>
        ))}
        <div className="flex justify-end gap-3 pt-2">
          <BlockSkeleton className="h-10 w-24" />
          <BlockSkeleton className="h-10 w-32" />
        </div>
      </div>
    </div>
  );
}
