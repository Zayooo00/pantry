import Link from "next/link";
import { JarMark } from "@/icons";
import { ResetPasswordForm } from "./reset-password-form";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const sp = await searchParams;
  const token = sp.token ?? "";

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
          NEW PASSWORD
        </div>
        <h1 className="m-0 mb-3 font-display text-[clamp(40px,5vw,64px)] leading-none font-light tracking-display [&_em]:font-normal [&_em]:italic">
          Set a new <em>key</em>.
        </h1>
        <p className="m-0 mb-6 font-display text-lg font-light text-ink-3 italic">
          Eight characters or more. Make it count.
        </p>

        {token ? (
          <ResetPasswordForm token={token} />
        ) : (
          <div className="rounded-md border border-tomato-2 bg-tomato-3 px-4 py-4 font-display text-sm text-tomato-2">
            This link is missing its token. Request a new reset link from{" "}
            <Link href="/forgot-password" className="border-b border-tomato-2">
              Forgot password
            </Link>
            .
          </div>
        )}
      </div>

      <aside className="hidden items-center justify-center bg-ink-1 bg-[radial-gradient(rgba(247,243,234,0.04)_1px,transparent_1px),radial-gradient(circle_at_80%_20%,rgba(90,107,58,0.15),transparent_50%),radial-gradient(circle_at_10%_90%,rgba(184,65,43,0.10),transparent_50%)] bg-size-[4px_4px,auto,auto] p-16 text-paper-0 md:flex">
        <div className="flex max-w-120 flex-col gap-8">
          <div className="font-mono text-xs tracking-mono text-paper-3 uppercase">
            A QUIET INVENTORY, KEPT HONEST.
          </div>
          <div className="font-display text-[clamp(36px,5vw,56px)] leading-[1.1] font-light tracking-display-md text-balance text-paper-0 [&_em]:font-normal [&_em]:text-amber-pantry-3 [&_em]:italic">
            A new <em>key</em>,<br />
            and the shelf <em>opens</em>.
          </div>
          <div className="font-mono text-xs tracking-mono text-paper-3 uppercase">
            EST. ONE KITCHEN
          </div>
        </div>
      </aside>
    </div>
  );
}
