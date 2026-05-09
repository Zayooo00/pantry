"use client";

import { SessionProvider as NextSessionProvider } from "next-auth/react";
import type { Session } from "next-auth";

export function SessionProvider({
  session,
  children,
}: {
  session: Session | null;
  children: React.ReactNode;
}) {
  return <NextSessionProvider session={session}>{children}</NextSessionProvider>;
}
