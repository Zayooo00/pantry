import { NextRequest, NextResponse } from "next/server";
import { getRecentEvents } from "@/lib/queries";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const url = new URL(req.url);
  const limitParam = url.searchParams.get("limit");
  const limit = limitParam ? Math.min(500, Math.max(1, Number(limitParam) || 100)) : 100;
  const beforeParam = url.searchParams.get("before");
  const before = beforeParam ? new Date(beforeParam) : undefined;
  const roomId = url.searchParams.get("roomId") || undefined;
  const kind = url.searchParams.get("kind") || undefined;
  const events = await getRecentEvents(session.user.id, { limit, before, roomId, kind });
  return NextResponse.json({ events });
}
