import { NextRequest, NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { db, users, passwordResets } from "@/db";
import { appUrl, emailLayout, escapeHtml, isEmailConfigured, sendEmail } from "@/lib/email";
import { generateToken, hashToken } from "@/lib/tokens";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { readJsonOr400 } from "@/lib/json";

export const dynamic = "force-dynamic";

const Body = z.object({
  email: z.string().trim().toLowerCase().email(),
});

const TOKEN_TTL_MS = 60 * 60 * 1000;

export async function POST(req: NextRequest) {
  const body = await readJsonOr400(req);
  if (body instanceof NextResponse) {
    return body;
  }
  const parsed = Body.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const limited = rateLimit({
    bucket: "password-reset",
    key: `${parsed.data.email}|${clientKey(req)}`,
    max: 5,
    windowMs: 60 * 60 * 1000,
  });
  if (!limited.allowed) {
    return NextResponse.json(
      { error: "Too many reset requests. Try again later." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } },
    );
  }
  const found = await db.select().from(users).where(eq(users.email, parsed.data.email)).limit(1);
  if (found.length === 0) {
    return NextResponse.json({ ok: true });
  }
  const user = found[0];
  if (!isEmailConfigured()) {
    return NextResponse.json(
      {
        error:
          "Email isn't configured on this server. Ask the owner to set SMTP_USER, SMTP_PASS, and EMAIL_FROM.",
      },
      { status: 503 },
    );
  }
  await db
    .update(passwordResets)
    .set({ usedAt: new Date() })
    .where(and(eq(passwordResets.userId, user.id), isNull(passwordResets.usedAt)));
  const token = generateToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);
  await db.insert(passwordResets).values({
    id: randomUUID(),
    userId: user.id,
    tokenHash,
    expiresAt,
  });
  const url = `${appUrl()}/reset-password?token=${encodeURIComponent(token)}`;
  const send = await sendEmail({
    to: user.email,
    subject: "Reset your Pantry password",
    html: emailLayout({
      preheader: "A request to reset your Pantry password.",
      body: `
        <p style="margin:0 0 16px">Hello ${escapeHtml(user.name)},</p>
        <p style="margin:0 0 16px">Someone (probably you) asked to reset the password on your Pantry account.</p>
        <p style="margin:0 0 24px">
          <a href="${url}" style="display:inline-block;background:#1a1814;color:#fbfaf6;padding:12px 20px;border-radius:6px;font-family:Georgia,serif;font-size:16px;text-decoration:none;">Reset password</a>
        </p>
        <p style="margin:0 0 16px;color:#7c7669;font-size:13px;">
          The link expires in one hour. If you didn't ask for this, you can ignore this email — your password stays the same.
        </p>
        <p style="margin:0;color:#7c7669;font-size:11px;font-family:monospace;word-break:break-all;">${escapeHtml(url)}</p>
      `,
    }),
    text: `Reset your Pantry password: ${url}\n\nThe link expires in one hour. If you didn't ask for this, ignore this email.`,
  });
  if (!send.ok) {
    return NextResponse.json({ error: send.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
