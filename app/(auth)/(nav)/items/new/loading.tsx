import { BadgeSkeleton, BlockSkeleton, ButtonSkeleton, TextSkeleton } from "@/components/skeleton";

function FieldSkeleton({ labelW = "5em" }: { labelW?: string }) {
  return (
    <div>
      <TextSkeleton size="xs" w={labelW} className="mb-2" />
      <BlockSkeleton className="h-12 w-full rounded-md" />
    </div>
  );
}

function SectionSkeleton({
  num,
  title,
  required,
  children,
  first,
}: {
  num: string;
  title: string;
  required: string;
  children: React.ReactNode;
  first?: boolean;
}) {
  return (
    <div className={first ? "" : "border-t border-dashed border-paper-3 pt-6"}>
      <div className="mb-4 flex items-baseline justify-between">
        <TextSkeleton size="2xl" w={`${(num.length + 3 + title.length) * 0.55}em`} />
        <TextSkeleton size="2xs" w={`${required.length * 0.65}em`} />
      </div>
      {children}
    </div>
  );
}

export default function NewItemLoading() {
  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-6 md:mb-12">
        <div>
          <TextSkeleton size="xs" w="6em" />
          <TextSkeleton size="3xl" w="11em" className="mt-2 leading-none sm:text-4xl lg:text-6xl" />
          <TextSkeleton size="md" w="20em" className="mt-3 sm:text-xl" />
        </div>
        <div className="flex flex-wrap gap-3">
          <ButtonSkeleton>Cancel</ButtonSkeleton>
          <ButtonSkeleton>Save &amp; add another</ButtonSkeleton>
          <ButtonSkeleton>Save item</ButtonSkeleton>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 items-center gap-3 rounded-xl border border-paper-3 bg-paper-1 p-5 md:grid-cols-[1fr_auto] md:p-6">
        <div>
          <TextSkeleton size="lg" w="22em" />
          <TextSkeleton size="2xs" w="28em" className="mt-1" />
        </div>
        <div className="flex justify-end">
          <ButtonSkeleton>▣ Type barcode</ButtonSkeleton>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 md:gap-12 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-8 rounded-xl border border-paper-3 bg-paper-0 p-5 md:p-8">
          <SectionSkeleton num="01" title="Identity" required="REQUIRED" first>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <FieldSkeleton labelW="6em" />
              </div>
              <FieldSkeleton labelW="4em" />
              <FieldSkeleton labelW="6em" />
              <div className="md:col-span-2">
                <TextSkeleton size="xs" w="3em" className="mb-2" />
                <div className="flex flex-wrap gap-2">
                  <ButtonSkeleton size="sm">tag 1</ButtonSkeleton>
                  <ButtonSkeleton size="sm">tag 2</ButtonSkeleton>
                  <ButtonSkeleton size="sm">+ Add tag</ButtonSkeleton>
                </div>
              </div>
            </div>
          </SectionSkeleton>

          <SectionSkeleton num="02" title="Quantity" required="REQUIRED">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FieldSkeleton labelW="9em" />
              <FieldSkeleton labelW="3em" />
              <div>
                <TextSkeleton size="xs" w="11em" className="mb-2" />
                <BlockSkeleton className="h-12 w-full rounded-md" />
                <TextSkeleton size="xs" w="22em" className="mt-1.5" />
              </div>
              <div>
                <TextSkeleton size="xs" w="11em" className="mb-2" />
                <BlockSkeleton className="h-12 w-full rounded-md" />
                <TextSkeleton size="xs" w="20em" className="mt-1.5" />
              </div>
            </div>
          </SectionSkeleton>

          <SectionSkeleton num="03" title="Where it lives" required="REQUIRED">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FieldSkeleton labelW="4em" />
              <FieldSkeleton labelW="13em" />
            </div>
          </SectionSkeleton>

          <SectionSkeleton num="04" title="Dates" required="OPTIONAL">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FieldSkeleton labelW="5em" />
              <FieldSkeleton labelW="5em" />
              <FieldSkeleton labelW="6em" />
              <FieldSkeleton labelW="6em" />
              <div className="md:col-span-2">
                <FieldSkeleton labelW="6em" />
              </div>
            </div>
          </SectionSkeleton>

          <SectionSkeleton num="05" title="Photo" required="OPTIONAL">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <ButtonSkeleton size="sm">Choose photo</ButtonSkeleton>
                <TextSkeleton size="xs" w="22em" />
              </div>
            </div>
          </SectionSkeleton>

          <SectionSkeleton num="06" title="Notes" required="OPTIONAL">
            <BlockSkeleton className="h-28 w-full rounded-md" />
          </SectionSkeleton>
        </div>

        <aside>
          <div className="rounded-xl border border-paper-3 bg-paper-1 p-6 lg:sticky lg:top-24">
            <TextSkeleton size="xs" w="5em" className="mb-3" />
            <BlockSkeleton className="mb-4 aspect-square w-full rounded-lg" />
            <TextSkeleton size="xs" w="11em" />
            <TextSkeleton size="2xl" w="9em" className="mt-2 leading-tight" />
            <div className="mt-3 flex items-center justify-between border-t border-dashed border-paper-3 pt-3">
              <TextSkeleton size="2xl" w="3em" className="leading-none" />
              <BadgeSkeleton>OK</BadgeSkeleton>
            </div>
            <TextSkeleton size="xs" w="20em" className="mt-4" />
          </div>
        </aside>
      </div>

      <footer className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-paper-3 pt-6 md:mt-24">
        <TextSkeleton size="xs" w="14em" />
        <TextSkeleton size="xs" w="13em" />
      </footer>
    </>
  );
}
