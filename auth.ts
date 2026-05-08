import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { authConfig } from "./auth.config";
import { db, users } from "./db";
import { verifyPassword } from "./lib/password";

const Creds = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(creds) {
        const parsed = Creds.safeParse(creds);
        if (!parsed.success) {
          return null;
        }
        const found = await db.select().from(users).where(eq(users.email, parsed.data.email.toLowerCase())).limit(1);
        if (found.length === 0) {
          return null;
        }
        const ok = await verifyPassword(parsed.data.password, found[0].passwordHash);
        if (!ok) {
          return null;
        }
        return { id: found[0].id, email: found[0].email, name: found[0].name };
      },
    }),
  ],
});
