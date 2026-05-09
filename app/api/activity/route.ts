import { NextRequest, NextResponse } from "next/server";
import { getRecentEvents } from "@/lib/queries";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

const ALLOWED_KINDS = new Set([
  "created",
  "consume",
  "restock",
  "open",
  "moved",
  "low_threshold_crossed",
]);

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const url = new URL(req.url);
  const limitParam = url.searchParams.get("limit");
  const limit = limitParam ? Math.min(500, Math.max(1, Number(limitParam) || 100)) : 100;

  const beforeParam = url.searchParams.get("before");
  let before: Date | undefined;
  if (beforeParam) {
    const parsed = new Date(beforeParam);
    if (Number.isNaN(parsed.getTime())) {
      return NextResponse.json({ error: "Invalid `before` timestamp." }, { status: 400 });
    }
    before = parsed;
  }

  const roomId = url.searchParams.get("roomId") || undefined;

  const kindParam = url.searchParams.get("kind") || undefined;
  if (kindParam && !ALLOWED_KINDS.has(kindParam)) {
    return NextResponse.json({ error: "Unknown event kind." }, { status: 400 });
  }

  const events = await getRecentEvents(session.user.id, {
    limit,
    before,
    roomId,
    kind: kindParam,
  });
  return NextResponse.json({ events });
}
