import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, emailVerifications, users } from "@/db";
import { hashToken } from "@/lib/tokens";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { readJsonOr400 } from "@/lib/json";
import { ResendVerificationRequest } from "@/lib/api/schemas";
import { isEmailConfigured } from "@/lib/email";
import {
  issueVerificationToken,
  markUserVerified,
  sendVerificationEmail,
} from "@/lib/verify-email";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Missing token." }, { status: 400 });
  }
  const tokenHash = hashToken(token);
  const found = await db
    .select({ verification: emailVerifications, user: users })
    .from(emailVerifications)
    .innerJoin(users, eq(users.id, emailVerifications.userId))
    .where(eq(emailVerifications.tokenHash, tokenHash))
    .limit(1);
  if (found.length === 0) {
    return NextResponse.json({ error: "This verification link is invalid." }, { status: 400 });
  }
  const { verification, user } = found[0];
  if (user.emailVerifiedAt) {
    return NextResponse.json({ ok: true, email: user.email });
  }
  if (verification.usedAt) {
    return NextResponse.json(
      { error: "This verification link was already used." },
      { status: 400 },
    );
  }
  if (verification.expiresAt.getTime() < Date.now()) {
    return NextResponse.json({ error: "This verification link has expired." }, { status: 400 });
  }
  await markUserVerified(user.id);
  return NextResponse.json({ ok: true, email: user.email });
}

export async function POST(req: NextRequest) {
  const body = await readJsonOr400(req);
  if (body instanceof NextResponse) {
    return body;
  }
  const parsed = ResendVerificationRequest.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const limited = rateLimit({
    bucket: "verify-resend",
    key: `${parsed.data.email}|${clientKey(req)}`,
    max: 5,
    windowMs: 60 * 60 * 1000,
  });
  if (!limited.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Try again later." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } },
    );
  }
  const found = await db.select().from(users).where(eq(users.email, parsed.data.email)).limit(1);
  if (found.length === 0 || found[0].emailVerifiedAt || !isEmailConfigured()) {
    return NextResponse.json({ ok: true, sent: false });
  }
  const token = await issueVerificationToken(found[0].id);
  const send = await sendVerificationEmail({
    to: found[0].email,
    name: found[0].name,
    token,
  });
  if (!send.ok) {
    console.error("verify-email resend: send failed", send.message);
    return NextResponse.json({ ok: true, sent: false });
  }
  return NextResponse.json({ ok: true, sent: true });
}
