"use client";
import { SessionProvider } from "next-auth/react";
import FirebaseAuthSync from "./FirebaseAuthSync";

type Props = {
  children?: React.ReactNode;
};

export default function AuthProvider({ children }: Props) {
  return (
    <SessionProvider
      refetchInterval={5 * 60} // Refetch session every 5 minutes
      refetchOnWindowFocus={true}
    >
      <FirebaseAuthSync />
      {children}
    </SessionProvider>
  );
}
