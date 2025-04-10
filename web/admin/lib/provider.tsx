"use client";

import { SessionProvider } from "next-auth/react";
import { Session } from "next-auth";

interface AuthTypes {
  children: React.ReactNode;
  session: Session | null;
}

export default function Provider({ children, session }: AuthTypes) {
  return <SessionProvider session={session}>{children}</SessionProvider>;
}
