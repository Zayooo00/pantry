import { NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

const TEST_PIXEL_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgAAIAAAUAAeImBZsAAAAASUVORK5CYII=",
  "base64",
);

export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  if (process.env.E2E_BLOB_LOCAL === "1") {
    return new NextResponse(TEST_PIXEL_PNG, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "private, max-age=60",
      },
    });
  }

  const { path } = await params;
  const pathname = path.join("/");

  const result = await get(pathname, { access: "private" });
  if (!result) {
    return new NextResponse(null, { status: 404 });
  }

  return new NextResponse(result.stream as unknown as BodyInit, {
    headers: {
      "Content-Type": result.blob.contentType ?? "application/octet-stream",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
