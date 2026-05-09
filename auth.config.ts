import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: { signIn: "/sign-in" },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const path = nextUrl.pathname;
      const isPublic =
        path === "/" ||
        path.startsWith("/welcome") ||
        path.startsWith("/sign-in") ||
        path.startsWith("/sign-up") ||
        path.startsWith("/forgot-password") ||
        path.startsWith("/reset-password") ||
        path.startsWith("/invite") ||
        path.startsWith("/api/auth") ||
        path.startsWith("/api/sign-up") ||
        path.startsWith("/api/password-reset") ||
        path.startsWith("/api/invites") ||
        path.startsWith("/api/cron");
      if (isPublic) {
        const isAuthGate =
          path === "/" ||
          path === "/welcome" ||
          path === "/sign-in" ||
          path === "/sign-up" ||
          path.startsWith("/forgot-password") ||
          path.startsWith("/reset-password");
        if (isLoggedIn && isAuthGate) {
          return Response.redirect(new URL("/dashboard", nextUrl));
        }
        return true;
      }
      return isLoggedIn;
    },
  },
  session: { strategy: "jwt" },
} satisfies NextAuthConfig;
