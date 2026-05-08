import { NextResponse } from "next/server";
import { getRecentEvents } from "@/lib/queries";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const events = await getRecentEvents(session.user.id, 200);
  return NextResponse.json({ events });
}
