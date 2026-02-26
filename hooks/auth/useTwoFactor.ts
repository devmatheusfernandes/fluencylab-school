// hooks/useTwoFactor.ts
import { useState } from "react";
import { useSession } from "next-auth/react";

// Extend the session type
// Removed local declaration in favor of global types/next-auth.d.ts

export const useTwoFactor = () => {
  const { data: session, update } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enableTwoFactor = async () => {
    setIsLoading(true);
    setError(null);

    try {
    } catch (err: any) {
      setError(err.message || "Failed to enable 2FA");
    } finally {
      setIsLoading(false);
    }
  };

  const disableTwoFactor = async () => {
    setIsLoading(true);
    setError(null);

    try {
    } catch (err: any) {
      setError(err.message || "Failed to disable 2FA");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    enableTwoFactor,
    disableTwoFactor,
    isTwoFactorEnabled: session?.user?.twoFactorEnabled || false,
  };
};
