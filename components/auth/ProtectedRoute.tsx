"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Spinner } from "../ui/spinner";

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export default function ProtectedRoute({
  children,
  redirectTo = "/signin",
}: ProtectedRouteProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // If not authenticated and not loading, redirect to signin
    if (status !== "loading" && !session) {
      router.push(redirectTo);
    }
  }, [status, session, router, redirectTo]);

  // Show loading while checking session
  if (status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  // If authenticated, render children
  if (session) {
    return <>{children}</>;
  }

  // If not authenticated, don't render anything (redirecting)
  return null;
}
