import { NextRequest, NextResponse } from "next/server";
import { and, eq, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { db, passwordResets, users } from "@/db";
import { hashToken } from "@/lib/tokens";
import { hashPassword } from "@/lib/password";
import { readJsonOr400 } from "@/lib/json";

export const dynamic = "force-dynamic";

const Body = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8).max(200),
});

export async function POST(req: NextRequest) {
  const body = await readJsonOr400(req);
  if (body instanceof NextResponse) {
    return body;
  }
  const parsed = Body.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const tokenHash = hashToken(parsed.data.token);
  const found = await db
    .select()
    .from(passwordResets)
    .where(eq(passwordResets.tokenHash, tokenHash))
    .limit(1);
  if (found.length === 0) {
    return NextResponse.json({ error: "This reset link is invalid." }, { status: 400 });
  }
  const reset = found[0];
  if (reset.usedAt) {
    return NextResponse.json({ error: "This reset link was already used." }, { status: 400 });
  }
  if (reset.expiresAt.getTime() < Date.now()) {
    return NextResponse.json({ error: "This reset link has expired." }, { status: 400 });
  }
  const newHash = await hashPassword(parsed.data.newPassword);
  await db
    .update(users)
    .set({ passwordHash: newHash, passwordVersion: sql`${users.passwordVersion} + 1` })
    .where(eq(users.id, reset.userId));
  await db
    .update(passwordResets)
    .set({ usedAt: new Date() })
    .where(
      and(eq(passwordResets.userId, reset.userId), isNull(passwordResets.usedAt)),
    );
  return NextResponse.json({ ok: true });
}
