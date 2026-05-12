import { requireUserId } from "@/lib/access";
import { ScanClient } from "./scan-client";

export const dynamic = "force-dynamic";

export default async function ScanPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  await requireUserId();
  const sp = await searchParams;
  const initialCode = sp.code && /^\d{8,14}$/.test(sp.code) ? sp.code : null;
  return <ScanClient initialCode={initialCode} />;
}
