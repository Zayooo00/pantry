import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db, pendingInvites, users } from "@/db";
import { hashPassword } from "@/lib/password";
import { SignUpRequest } from "@/lib/api/schemas";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { readJsonOr400 } from "@/lib/json";
import { isEmailConfigured } from "@/lib/email";
import { issueVerificationToken, sendVerificationEmail } from "@/lib/verify-email";
import { hashToken } from "@/lib/tokens";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await readJsonOr400(req);
  if (body instanceof NextResponse) {
    return body;
  }
  const parsed = SignUpRequest.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input. Email must be valid; password ≥ 8 chars." },
      { status: 400 },
    );
  }
  const limited = rateLimit({
    bucket: "sign-up",
    key: clientKey(req),
    max: 10,
    windowMs: 60 * 60 * 1000,
  });
  if (!limited.allowed) {
    return NextResponse.json(
      { error: "Too many signup attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } },
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

  let preVerified = false;
  if (parsed.data.inviteToken) {
    const found = await db
      .select()
      .from(pendingInvites)
      .where(eq(pendingInvites.tokenHash, hashToken(parsed.data.inviteToken)))
      .limit(1);
    if (
      found.length > 0 &&
      found[0].email.toLowerCase() === email &&
      found[0].acceptedAt === null &&
      found[0].expiresAt.getTime() > Date.now()
    ) {
      preVerified = true;
    }
  }

  const id = randomUUID();
  const passwordHash = await hashPassword(parsed.data.password);
  await db.insert(users).values({
    id,
    email,
    name: parsed.data.name.trim(),
    passwordHash,
    emailVerifiedAt: preVerified ? new Date() : null,
  });

  if (preVerified) {
    return NextResponse.json({ ok: true, verified: true, emailSent: false });
  }

  const token = await issueVerificationToken(id);
  if (!isEmailConfigured()) {
    return NextResponse.json({ ok: true, verified: false, emailSent: false });
  }
  const send = await sendVerificationEmail({
    to: email,
    name: parsed.data.name.trim(),
    token,
  });
  if (!send.ok) {
    return NextResponse.json({ ok: true, verified: false, emailSent: false });
  }
  return NextResponse.json({ ok: true, verified: false, emailSent: true });
}
