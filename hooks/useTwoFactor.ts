// hooks/useTwoFactor.ts
import { useState } from "react";
import { useSession } from "next-auth/react";

// Extend the session type
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
      permissions?: string[];
      tutorialCompleted?: boolean;
      twoFactorEnabled?: boolean;
    }
  }
}

export const useTwoFactor = () => {
  const { data: session, update } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enableTwoFactor = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // This would call the API to enable 2FA
      // Implementation depends on your specific API structure
      console.log("Enabling 2FA");
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
      // This would call the API to disable 2FA
      // Implementation depends on your specific API structure
      console.log("Disabling 2FA");
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