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
  if (parsed.data.name) {
    update.name = parsed.data.name.trim();
  }
  if (parsed.data.email) {
    const email = parsed.data.email;
    if (email !== me[0].email) {
      const dup = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (dup.length > 0) {
        return NextResponse.json(
          { error: "Another account already uses that email." },
          { status: 409 },
        );
      }
      update.email = email;
    }
  }
  if (parsed.data.newPassword) {
    if (!parsed.data.currentPassword) {
      return NextResponse.json(
        { error: "Enter your current password to change it." },
        { status: 400 },
      );
    }
    const ok = await verifyPassword(parsed.data.currentPassword, me[0].passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "Current password doesn't match." }, { status: 400 });
    }
    update.passwordHash = await hashPassword(parsed.data.newPassword);
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ ok: true });
  }
  await db.update(users).set(update).where(eq(users.id, me[0].id));
  return NextResponse.json({ ok: true });
}
