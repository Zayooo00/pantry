import { NextRequest, NextResponse } from "next/server";
import { db, users } from "@/db";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import { PatchMeRequest } from "@/lib/api/schemas";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const parsed = PatchMeRequest.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const me = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);
  if (me.length === 0) {
    return NextResponse.json({ error: "Account no longer exists." }, { status: 404 });
  }
  const update: Partial<typeof users.$inferInsert> = {};
  const wantsEmailChange =
    parsed.data.email !== undefined && parsed.data.email !== me[0].email;
  const wantsPasswordChange = Boolean(parsed.data.newPassword);

  if ((wantsEmailChange || wantsPasswordChange) && !parsed.data.currentPassword) {
    return NextResponse.json(
      { error: "Enter your current password to change your email or password." },
      { status: 400 },
    );
  }
  if (wantsEmailChange || wantsPasswordChange) {
    const ok = await verifyPassword(parsed.data.currentPassword!, me[0].passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "Current password doesn't match." }, { status: 400 });
    }
  }

  if (parsed.data.name) {
    update.name = parsed.data.name.trim();
  }
  if (wantsEmailChange) {
    const email = parsed.data.email!;
    const dup = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (dup.length > 0) {
      return NextResponse.json(
        { error: "Another account already uses that email." },
        { status: 409 },
      );
    }
    update.email = email;
  }
  if (wantsPasswordChange) {
    update.passwordHash = await hashPassword(parsed.data.newPassword!);
    update.passwordVersion = (me[0].passwordVersion ?? 1) + 1;
  }
  if (parsed.data.notifyDigest) {
    update.notifyDigest = parsed.data.notifyDigest;
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ ok: true });
  }
  await db.update(users).set(update).where(eq(users.id, me[0].id));
  return NextResponse.json({ ok: true });
}
