import Link from "next/link";
import { JarMark } from "@/icons";
import { cn } from "@/lib/cn";
import { button } from "@/components/button";

export const dynamic = "force-dynamic";

export default function WelcomePage() {
  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-paper-0">
      <div className="flex flex-col justify-center px-[clamp(24px,6vw,96px)] py-12 max-w-140 w-full ml-auto">
        <Link href="/" className="flex gap-3 items-center mb-16 text-inherit no-underline">
          <div className="w-9.5 h-9.5 border-[1.5px] border-ink-1 rounded-sm grid place-items-center bg-paper-0 text-ink-1">
            <JarMark size={22} />
          </div>
          <div>
            <div className="font-display text-xl font-normal tracking-display-sm">Pantry</div>
            <div className="font-mono text-xs tracking-mono uppercase text-ink-4">EST. KITCHEN · NO. 0001</div>
          </div>
        </Link>

        <div className="font-mono text-xs tracking-mono uppercase text-ink-4 mb-4">WELCOME · NO. 0000</div>
        <h1 className="font-display font-light text-[clamp(56px,7vw,88px)] tracking-display leading-[0.95] m-0 mb-3 [&_em]:italic [&_em]:font-normal">
          A quiet inventory,<br />
          <em>kept honest</em>.
        </h1>
        <p className="font-display italic font-light text-xl text-ink-3 m-0 mb-10">
          Track what's in the pantry, what's running low, and what to pick up next.
        </p>

        <div className="flex flex-col gap-3 mt-8">
          <Link href="/signup" className={cn(button({ variant: "primary", size: "lg" }), "w-full text-center")}>
            Create an account
          </Link>
          <Link href="/signin" className={cn(button({ variant: "secondary", size: "lg" }), "w-full text-center")}>
            Sign in
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-dashed border-paper-3 text-sm text-ink-3 font-display italic">
          <span className="font-mono text-xs tracking-mono uppercase text-ink-4">No setup required · works on mobile and desktop</span>
        </div>
      </div>

      <aside className="hidden md:flex bg-ink-1 text-paper-0 items-center justify-center p-16 bg-[radial-gradient(rgba(247,243,234,0.04)_1px,transparent_1px),radial-gradient(circle_at_80%_20%,rgba(90,107,58,0.15),transparent_50%),radial-gradient(circle_at_10%_90%,rgba(184,65,43,0.10),transparent_50%)] bg-size-[4px_4px,auto,auto]">
        <div className="max-w-120 flex flex-col gap-8">
          <div className="font-mono text-xs tracking-mono uppercase text-paper-3">A QUIET INVENTORY, KEPT HONEST.</div>
          <div className="font-display font-light text-[clamp(36px,5vw,56px)] leading-[1.1] tracking-display-md text-paper-0 [&_em]:italic [&_em]:font-normal [&_em]:text-amber-pantry-3">
            Every <em>jar</em>,<br />
            every <em>bottle</em>,<br />
            every <em>bag</em>.
          </div>
          <div className="font-mono text-xs tracking-mono uppercase text-paper-3">EST. ONE KITCHEN</div>
        </div>
      </aside>
    </div>
  );
}
