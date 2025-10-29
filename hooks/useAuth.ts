"use client";

import { useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export const useAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { data: session } = useSession();

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    // This function calls the API of NextAuth securely
    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    setIsLoading(false);

    if (result?.error) {
      setError("Email ou senha inválidos.");
    } else if (result?.ok) {
      // Redirect to hub after successful login
      router.push("/hub");
    }
  };

  // Check if user is authenticated
  const isAuthenticated = !!session?.user;

  return { login, isLoading, error, isAuthenticated };
};
