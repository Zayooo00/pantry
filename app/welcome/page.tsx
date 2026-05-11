import Link from "next/link";
import { JarMark } from "@/icons";
import { Button } from "@/components/button";

export const dynamic = "force-dynamic";

export default function WelcomePage() {
  return (
    <div className="grid min-h-screen grid-cols-1 bg-paper-0 md:grid-cols-2">
      <div className="mx-auto flex w-full max-w-120 flex-col justify-center px-[clamp(24px,5vw,64px)] py-10">
        <Link href="/" className="mb-10 flex items-center gap-3 text-inherit no-underline">
          <div className="grid h-9.5 w-9.5 place-items-center rounded-sm border-[1.5px] border-ink-1 bg-paper-0 text-ink-1">
            <JarMark size={22} />
          </div>
          <div>
            <div className="font-display text-xl font-normal tracking-display-sm">Pantry</div>
            <div className="font-mono text-xs tracking-mono text-ink-4 uppercase">
              EST. KITCHEN · NO. 0001
            </div>
          </div>
        </Link>

        <div className="mb-3 font-mono text-xs tracking-mono text-ink-4 uppercase">
          WELCOME · NO. 0000
        </div>
        <h1 className="m-0 mb-3 font-display text-[clamp(40px,5vw,64px)] leading-none font-light tracking-display [&_em]:font-normal [&_em]:italic">
          A quiet inventory,
          <br />
          <em>kept honest</em>.
        </h1>
        <p className="m-0 mb-6 font-display text-lg font-light text-ink-3 italic">
          Track what's in the pantry, what's running low, and what to pick up next.
        </p>

        <div className="flex flex-col gap-3">
          <Button asChild variant="primary" size="lg" className="w-full text-center">
            <Link href="/sign-up">Create an account</Link>
          </Button>
          <Button asChild variant="secondary" size="lg" className="w-full text-center">
            <Link href="/sign-in">Sign in</Link>
          </Button>
        </div>

        <div className="mt-6 border-t border-dashed border-paper-3 pt-4 font-mono text-xs tracking-mono text-ink-4 uppercase">
          No setup required · works on mobile and desktop
        </div>
      </div>

      <aside className="hidden items-center justify-center bg-ink-1 bg-[radial-gradient(rgba(247,243,234,0.04)_1px,transparent_1px),radial-gradient(circle_at_80%_20%,rgba(90,107,58,0.15),transparent_50%),radial-gradient(circle_at_10%_90%,rgba(184,65,43,0.10),transparent_50%)] bg-size-[4px_4px,auto,auto] p-16 text-paper-0 md:flex">
        <div className="flex max-w-120 flex-col gap-8">
          <div className="font-mono text-xs tracking-mono text-paper-3 uppercase">
            A QUIET INVENTORY, KEPT HONEST.
          </div>
          <div className="font-display text-[clamp(36px,5vw,56px)] leading-[1.1] font-light tracking-display-md text-paper-0 [&_em]:font-normal [&_em]:text-amber-pantry-3 [&_em]:italic">
            Every <em>jar</em>,<br />
            every <em>bottle</em>,<br />
            every <em>bag</em>.
          </div>
          <div className="font-mono text-xs tracking-mono text-paper-3 uppercase">
            EST. ONE KITCHEN
          </div>
        </div>
      </aside>
    </div>
  );
}
