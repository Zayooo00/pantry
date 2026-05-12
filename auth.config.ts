import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: { signIn: "/sign-in" },
  providers: [],
  callbacks: {
    session({ session, token }) {
      if (token?.id && session.user) {
        const user = session.user as {
          id?: string;
          name?: string;
          email?: string;
          emailVerified?: boolean;
        };
        user.id = token.id;
        user.name = token.name ?? "";
        user.email = token.email ?? "";
        user.emailVerified = !!token.emailVerified;
      } else if (session.user) {
        delete (session.user as { id?: string }).id;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user?.id;
      const path = nextUrl.pathname;
      const isPublic =
        path === "/" ||
        path.startsWith("/welcome") ||
        path.startsWith("/sign-in") ||
        path.startsWith("/sign-up") ||
        path.startsWith("/forgot-password") ||
        path.startsWith("/reset-password") ||
        path.startsWith("/verify-email") ||
        path.startsWith("/invite") ||
        path.startsWith("/api/auth") ||
        path.startsWith("/api/sign-up") ||
        path.startsWith("/api/password-reset") ||
        path.startsWith("/api/verify-email") ||
        path.startsWith("/api/invites") ||
        path.startsWith("/api/cron");
      const emailVerified = auth?.user?.emailVerified ?? false;
      if (isPublic) {
        const isAuthGate =
          path === "/" ||
          path === "/welcome" ||
          path === "/sign-in" ||
          path === "/sign-up" ||
          path.startsWith("/forgot-password") ||
          path.startsWith("/reset-password") ||
          path.startsWith("/verify-email");
        if (isLoggedIn && emailVerified && isAuthGate) {
          return Response.redirect(new URL("/dashboard", nextUrl));
        }
        return true;
      }
      if (!isLoggedIn) {
        return false;
      }
      if (!emailVerified) {
        const url = new URL("/verify-email", nextUrl);
        if (auth?.user?.email) {
          url.searchParams.set("email", auth.user.email);
        }
        return Response.redirect(url);
      }
      return true;
    },
  },
  session: { strategy: "jwt" },
} satisfies NextAuthConfig;
