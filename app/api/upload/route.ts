import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { randomUUID } from "node:crypto";
import { auth } from "@/auth";
import { rateLimit } from "@/lib/rate-limit";

const MAX_BYTES = 5 * 1024 * 1024;

export const dynamic = "force-dynamic";

async function looksLikeImage(file: File): Promise<boolean> {
  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  if (head.length < 12) {
    return false;
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    head[0] === 0x89 &&
    head[1] === 0x50 &&
    head[2] === 0x4e &&
    head[3] === 0x47 &&
    head[4] === 0x0d &&
    head[5] === 0x0a &&
    head[6] === 0x1a &&
    head[7] === 0x0a
  ) {
    return true;
  }
  // JPEG: FF D8 FF
  if (head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) {
    return true;
  }
  // GIF: "GIF8"
  if (head[0] === 0x47 && head[1] === 0x49 && head[2] === 0x46 && head[3] === 0x38) {
    return true;
  }
  // WebP: "RIFF" .... "WEBP"
  if (
    head[0] === 0x52 &&
    head[1] === 0x49 &&
    head[2] === 0x46 &&
    head[3] === 0x46 &&
    head[8] === 0x57 &&
    head[9] === 0x45 &&
    head[10] === 0x42 &&
    head[11] === 0x50
  ) {
    return true;
  }
  // HEIC/AVIF: bytes 4-7 are "ftyp", brand at 8-11
  if (head[4] === 0x66 && head[5] === 0x74 && head[6] === 0x79 && head[7] === 0x70) {
    const brand = String.fromCharCode(head[8], head[9], head[10], head[11]);
    if (["heic", "heix", "hevc", "hevm", "hevs", "mif1", "msf1", "avif", "avis"].includes(brand)) {
      return true;
    }
  }
  // BMP: "BM"
  if (head[0] === 0x42 && head[1] === 0x4d) {
    return true;
  }
  return false;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const limited = rateLimit({
    bucket: "upload",
    key: session.user.id,
    max: 60,
    windowMs: 60 * 60 * 1000,
  });
  if (!limited.allowed) {
    return NextResponse.json(
      { error: "Too many uploads. Try again later." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } },
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart/form-data." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file field." }, { status: 400 });
  }

  if (!file.type || !file.type.startsWith("image/") || file.type === "image/svg+xml") {
    return NextResponse.json({ error: "Only image uploads are allowed." }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image must be 5MB or smaller." }, { status: 400 });
  }

  if (!(await looksLikeImage(file))) {
    return NextResponse.json({ error: "Only image uploads are allowed." }, { status: 400 });
  }

  const original = file.name || "photo";
  const dot = original.lastIndexOf(".");
  const ext = (dot >= 0 ? original.slice(dot + 1) : "").replace(/[^a-zA-Z0-9]+/g, "").slice(0, 8);
  const base =
    (dot >= 0 ? original.slice(0, dot) : original)
      .replace(/[^a-zA-Z0-9-_]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "photo";
  const suffix = ext ? `.${ext}` : "";
  const id = randomUUID();
  const pathname = `items/${session.user.id}/${id}-${base}${suffix}`;

  if (process.env.E2E_BLOB_LOCAL === "1") {
    return NextResponse.json({ url: `/api/photos/${pathname}` });
  }

  try {
    const blob = await put(pathname, file, {
      access: "private",
      contentType: file.type,
    });
    return NextResponse.json({ url: `/api/photos/${blob.pathname}` });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
