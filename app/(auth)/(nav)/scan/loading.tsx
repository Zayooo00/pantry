import { BarcodeScannerSkeleton } from "@/components/barcode-scanner";

export default function Loading() {
  return (
    <div className="mx-auto flex max-w-160 flex-col gap-6">
      <div>
        <div className="caption">SCAN</div>
        <div className="mt-2 h-12 w-full max-w-72 animate-pulse rounded-md bg-paper-2" />
        <div className="mt-3 h-5 w-full max-w-56 animate-pulse rounded-md bg-paper-2" />
      </div>
      <BarcodeScannerSkeleton />
    </div>
  );
}
