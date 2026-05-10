import Link from "next/link";
import { JarMark } from "@/icons";
import { SignInForm } from "./sign-in-form";

export const dynamic = "force-dynamic";

export default function SignInPage() {
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
          SIGN IN · NO. 0042
        </div>
        <h1 className="m-0 mb-3 font-display text-[clamp(40px,5vw,64px)] leading-none font-light tracking-display [&_em]:font-normal [&_em]:italic">
          Welcome <em>back</em>.
        </h1>
        <p className="m-0 mb-6 font-display text-lg font-light text-ink-3 italic">
          The shelf has been waiting.
        </p>

        <SignInForm />

        <div className="mt-4 text-right">
          <Link
            href="/forgot-password"
            className="font-display text-sm text-ink-3 italic underline-offset-4 transition-colors duration-150 ease-pantry hover:text-olive-2 hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <div className="mt-6 border-t border-dashed border-paper-3 pt-4 font-display text-sm text-ink-3 italic">
          <span>New here?</span>{" "}
          <Link
            href="/sign-up"
            className="border-b border-ink-1 pb-px text-ink-1 not-italic transition-colors duration-150 ease-pantry hover:border-olive-2 hover:text-olive-2"
          >
            Create an account →
          </Link>
        </div>
      </div>

      <aside className="hidden items-center justify-center bg-ink-1 bg-[radial-gradient(rgba(247,243,234,0.04)_1px,transparent_1px),radial-gradient(circle_at_80%_20%,rgba(90,107,58,0.15),transparent_50%),radial-gradient(circle_at_10%_90%,rgba(184,65,43,0.10),transparent_50%)] bg-size-[4px_4px,auto,auto] p-16 text-paper-0 md:flex">
        <div className="flex max-w-120 flex-col gap-8">
          <div className="font-mono text-xs tracking-mono text-paper-3 uppercase">
            A QUIET INVENTORY, KEPT HONEST.
          </div>
          <div className="font-display text-[clamp(36px,5vw,56px)] leading-[1.1] font-light tracking-display-md text-balance text-paper-0 [&_em]:font-normal [&_em]:text-amber-pantry-3 [&_em]:italic">
            "Olive oil is at <em>0.4 L</em>. You set the floor at <em>1 L</em>."
          </div>
          <div className="font-mono text-xs tracking-mono text-paper-3 uppercase">
            EST. ONE KITCHEN
          </div>
        </div>
      </aside>
    </div>
  );
}
