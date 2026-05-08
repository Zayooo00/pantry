import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: { signIn: "/welcome" },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const path = nextUrl.pathname;
      const isPublic =
        path === "/" ||
        path.startsWith("/welcome") ||
        path.startsWith("/signin") ||
        path.startsWith("/signup") ||
        path.startsWith("/api/auth") ||
        path.startsWith("/api/signup");
      if (isPublic) {
        const isAuthGate =
          path === "/" ||
          path === "/welcome" ||
          path === "/signin" ||
          path === "/signup";
        if (isLoggedIn && isAuthGate) {
          return Response.redirect(new URL("/dashboard", nextUrl));
        }
        return true;
      }
      return isLoggedIn;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
      }
      return session;
    },
  },
  session: { strategy: "jwt" },
} satisfies NextAuthConfig;
