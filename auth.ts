import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { authConfig } from "./auth.config";
import { db, users } from "./db";
import { verifyPassword } from "./lib/password";
import { clientKey, rateLimit } from "./lib/rate-limit";

const Creds = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

class TooManyAttempts extends CredentialsSignin {
  code = "too_many_attempts";
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  debug: process.env.E2E_BYPASS_RATE_LIMIT === "1",
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(creds, request) {
        const debug = process.env.E2E_BYPASS_RATE_LIMIT === "1";
        const parsed = Creds.safeParse(creds);
        if (!parsed.success) {
          if (debug) {
            console.log("[auth-debug] parse failed", parsed.error.flatten());
          }
          return null;
        }
        const ip = request ? clientKey({ headers: request.headers }) : "unknown";
        const limited = rateLimit({
          bucket: "signin",
          key: `${parsed.data.email.toLowerCase()}|${ip}`,
          max: 10,
          windowMs: 15 * 60 * 1000,
        });
        if (!limited.allowed) {
          if (debug) {
            console.log("[auth-debug] rate-limited", parsed.data.email);
          }
          throw new TooManyAttempts();
        }
        const found = await db
          .select()
          .from(users)
          .where(eq(users.email, parsed.data.email.toLowerCase()))
          .limit(1);
        if (debug) {
          console.log("[auth-debug] db lookup", parsed.data.email, "found:", found.length);
        }
        if (found.length === 0) {
          return null;
        }
        const ok = await verifyPassword(parsed.data.password, found[0].passwordHash);
        if (debug) {
          console.log("[auth-debug] password ok:", ok);
        }
        if (!ok) {
          return null;
        }
        return {
          id: found[0].id,
          email: found[0].email,
          name: found[0].name,
          passwordVersion: found[0].passwordVersion,
        } as { id: string; email: string; name: string; passwordVersion: number };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = (user as { id: string }).id;
        token.email = user.email ?? null;
        token.name = user.name ?? null;
        token.passwordVersion = (user as { passwordVersion?: number }).passwordVersion ?? 1;
        token.lastChecked = Date.now();
        return token;
      }
      const id = token.id as string | undefined;
      if (!id) {
        return token;
      }
      const lastChecked = (token.lastChecked as number) ?? 0;
      const due = Date.now() - lastChecked > REFRESH_INTERVAL_MS;
      if (trigger === "update" || due) {
        const found = await db
          .select({
            email: users.email,
            name: users.name,
            passwordVersion: users.passwordVersion,
          })
          .from(users)
          .where(eq(users.id, id))
          .limit(1);
        if (found.length === 0 || found[0].passwordVersion !== token.passwordVersion) {
          return { ...token, id: undefined, email: null, name: null, passwordVersion: undefined };
        }
        token.email = found[0].email;
        token.name = found[0].name;
        token.lastChecked = Date.now();
      }
      return token;
    },
    session({ session, token }) {
      if (token?.id && session.user) {
        session.user.id = token.id as string;
        session.user.name = (token.name as string) ?? "";
        session.user.email = (token.email as string) ?? "";
      } else if (session.user) {
        delete (session.user as { id?: string }).id;
      }
      return session;
    },
  },
});
