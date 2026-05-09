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
      <div className="ml-auto flex w-full max-w-140 flex-col justify-center px-[clamp(24px,6vw,96px)] py-12">
        <Link href="/" className="mb-16 flex items-center gap-3 text-inherit no-underline">
          <div className="grid h-9.5 w-9.5 place-items-center rounded-sm border-[1.5px] border-ink-1 bg-paper-0 text-ink-1">
            <JarMark size={22} />
          </div>
          <div>
            <div className="font-display text-xl font-normal tracking-[-0.01em]">Pantry</div>
            <div className="font-mono text-xs tracking-[0.06em] text-ink-4 uppercase">
              EST. KITCHEN · NO. 0001
            </div>
          </div>
        </Link>

        <div className="mb-4 font-mono text-xs tracking-[0.06em] text-ink-4 uppercase">
          NEW PASSWORD
        </div>
        <h1 className="m-0 mb-3 font-display text-[clamp(56px,7vw,88px)] leading-[0.95] font-light tracking-[-0.03em] [&_em]:font-normal [&_em]:italic">
          Set a new <em>key</em>.
        </h1>
        <p className="m-0 mb-10 font-display text-xl font-light text-ink-3 italic">
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

      <aside className="hidden items-center justify-center bg-ink-1 bg-[radial-gradient(rgba(247,243,234,0.04)_1px,transparent_1px)] bg-size-[4px_4px] p-16 text-paper-0 md:flex" />
    </div>
  );
}
