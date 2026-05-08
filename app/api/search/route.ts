import { NextRequest, NextResponse } from "next/server";
import { searchItems } from "@/lib/queries";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const items = await searchItems(session.user.id, q);
  return NextResponse.json({
    items: items.slice(0, 20).map((i) => ({
      id: i.id,
      name: i.name,
      roomId: i.roomId,
      category: i.category,
    })),
  });
}
