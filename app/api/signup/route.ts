import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db, users } from "@/db";
import { hashPassword } from "@/lib/password";
import { SignupRequest } from "@/lib/api/schemas";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const parsed = SignupRequest.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input. Email must be valid; password ≥ 8 chars." },
      { status: 400 },
    );
  }
  const email = parsed.data.email;
  const exists = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (exists.length > 0) {
    return NextResponse.json(
      { error: "An account with that email already exists." },
      { status: 409 },
    );
  }
  const id = randomUUID();
  const passwordHash = await hashPassword(parsed.data.password);
  await db.insert(users).values({
    id,
    email,
    name: parsed.data.name.trim(),
    passwordHash,
  });
  return NextResponse.json({ ok: true });
}
