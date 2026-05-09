import { InviteClient } from "./invite-client";

export const dynamic = "force-dynamic";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return (
    <div className="grid min-h-screen place-items-center bg-paper-0 px-4 py-12">
      <InviteClient token={token} />
    </div>
  );
}
