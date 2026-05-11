import { randomUUID } from "node:crypto";
import { db, emailVerifications, users } from "@/db";
import { eq, and, isNull } from "drizzle-orm";
import { appUrl, emailLayout, escapeHtml, sendEmail } from "@/lib/email";
import { generateToken, hashToken } from "@/lib/tokens";

export const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

export async function issueVerificationToken(userId: string): Promise<string> {
  await db
    .update(emailVerifications)
    .set({ usedAt: new Date() })
    .where(and(eq(emailVerifications.userId, userId), isNull(emailVerifications.usedAt)));
  const token = generateToken();
  await db.insert(emailVerifications).values({
    id: randomUUID(),
    userId,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + VERIFICATION_TTL_MS),
  });
  return token;
}

export async function sendVerificationEmail(opts: {
  to: string;
  name: string;
  token: string;
}): ReturnType<typeof sendEmail> {
  const url = `${appUrl()}/verify-email?token=${encodeURIComponent(opts.token)}`;
  return sendEmail({
    to: opts.to,
    subject: "Confirm your Pantry email",
    html: emailLayout({
      preheader: "Confirm your email to finish creating your Pantry account.",
      body: `
        <p style="margin:0 0 16px">Hello ${escapeHtml(opts.name)},</p>
        <p style="margin:0 0 16px">Welcome to Pantry. Please confirm this email address to finish creating your account.</p>
        <p style="margin:0 0 24px">
          <a href="${url}" style="display:inline-block;background:#1a1814;color:#fbfaf6;padding:12px 20px;border-radius:6px;font-family:Georgia,serif;font-size:16px;text-decoration:none;">Confirm email</a>
        </p>
        <p style="margin:0 0 16px;color:#7c7669;font-size:13px;">
          The link expires in 24 hours. If you didn't sign up, you can ignore this email.
        </p>
        <p style="margin:0;color:#7c7669;font-size:11px;font-family:monospace;word-break:break-all;">${escapeHtml(url)}</p>
      `,
    }),
    text: `Confirm your Pantry email: ${url}\n\nThe link expires in 24 hours. If you didn't sign up, ignore this email.`,
  });
}

export async function markUserVerified(userId: string): Promise<void> {
  const now = new Date();
  await db.update(users).set({ emailVerifiedAt: now }).where(eq(users.id, userId));
  await db
    .update(emailVerifications)
    .set({ usedAt: now })
    .where(and(eq(emailVerifications.userId, userId), isNull(emailVerifications.usedAt)));
}
