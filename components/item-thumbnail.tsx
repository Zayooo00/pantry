import Image from "next/image";
import { cn } from "@/lib/cn";
import { shortLabel } from "@/lib/format";

type Props = {
  name: string;
  photoUrl: string | null;
  className?: string;
  abbrevLength?: number;
  sizes?: string;
};

export function ItemThumbnail({
  name,
  photoUrl,
  className,
  abbrevLength = 3,
  sizes = "(max-width: 768px) 80px, 160px",
}: Props) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md border border-paper-3",
        !photoUrl &&
          "grid place-items-center bg-[repeating-linear-gradient(45deg,var(--color-paper-2)_0_6px,var(--color-paper-1)_6px_12px)] font-mono text-2xs tracking-widest text-ink-4 uppercase",
        className,
      )}
    >
      {photoUrl ? (
        <Image src={photoUrl} alt={name} fill sizes={sizes} className="object-cover" />
      ) : (
        shortLabel(name, abbrevLength)
      )}
    </div>
  );
}
