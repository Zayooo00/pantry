import Link from "next/link";
import { button } from "@/components/button";

export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <div className="grid min-h-screen grid-cols-1 bg-paper-0 md:grid-cols-2">
      <div className="ml-auto flex w-full max-w-140 flex-col justify-center px-[clamp(24px,6vw,96px)] py-12">
        <div className="mb-4 font-mono text-xs tracking-[0.06em] text-ink-4 uppercase">
          404 · NO. 0404
        </div>
        <h1 className="m-0 mb-3 font-display text-[clamp(56px,7vw,88px)] leading-[0.95] font-light tracking-[-0.03em] [&_em]:font-normal [&_em]:italic">
          Not on the <em>shelf</em>.
        </h1>
        <p className="m-0 mb-10 font-display text-xl font-light text-ink-3 italic">
          That page is missing from the pantry.
        </p>
        <div className="mt-6 flex gap-3">
          <Link href="/dashboard" className={button({ variant: "primary" })}>
            Back to dashboard
          </Link>
          <Link href="/rooms" className={button({ variant: "ghost" })}>
            Browse rooms
          </Link>
        </div>
      </div>
      <aside className="hidden items-center justify-center bg-ink-1 bg-[radial-gradient(rgba(247,243,234,0.04)_1px,transparent_1px),radial-gradient(circle_at_80%_20%,rgba(90,107,58,0.15),transparent_50%),radial-gradient(circle_at_10%_90%,rgba(184,65,43,0.10),transparent_50%)] bg-size-[4px_4px,auto,auto] p-16 text-paper-0 md:flex">
        <div className="flex max-w-120 flex-col gap-8">
          <div className="font-mono text-xs tracking-[0.06em] text-paper-3 uppercase">
            A QUIET INVENTORY, KEPT HONEST.
          </div>
          <div className="font-display text-[clamp(36px,5vw,56px)] leading-[1.1] font-light tracking-[-0.02em] text-paper-0 [&_em]:font-normal [&_em]:text-amber-pantry-3 [&_em]:italic">
            "The shelf does not <em>lie</em>."
          </div>
          <div className="font-mono text-xs tracking-[0.06em] text-paper-3 uppercase">
            PANTRY · NO. 0001
          </div>
        </div>
      </aside>
    </div>
  );
}
