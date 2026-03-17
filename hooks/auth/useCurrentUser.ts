"use client";

import { useSession } from "next-auth/react";
import { UserPermission } from "@/types/users/userPermissions";
import { FullUserDetails } from "@/types/users/userDetails";
import { useState, useEffect } from "react";
import { User } from "@/types/users/users";

/**
 * Hook customizado para obter os dados COMPLETOS do utilizador logado,
 * combinando a sessão do NextAuth com o perfil do Firestore.
 */
export const useCurrentUser = () => {
  const { data: session, status } = useSession();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  useEffect(() => {
    const storageKey = "fluencylab.currentUser.v1";

    const fetchFullUser = async () => {
      if (status === "authenticated") {
        setIsLoadingUser(true);
        try {
          const response = await fetch("/api/users/me");
          if (!response.ok) {
            throw new Error("Falha ao buscar o perfil completo do utilizador.");
          }
          const userProfile: FullUserDetails = await response.json();
          setCurrentUser(userProfile);

          try {
            localStorage.setItem(storageKey, JSON.stringify(userProfile));
          } catch {}
        } catch (error) {
          console.error(error);

          try {
            const cached = localStorage.getItem(storageKey);
            if (cached) {
              setCurrentUser(JSON.parse(cached) as FullUserDetails);
              return;
            }
          } catch {}

          setCurrentUser(session.user as FullUserDetails);
        } finally {
          setIsLoadingUser(false);
        }
      } else if (status !== "loading") {
        setCurrentUser(null);
        setIsLoadingUser(false);

        try {
          localStorage.removeItem(storageKey);
        } catch {}
      }
    };

    fetchFullUser();
  }, [status, session]);

  return {
    user: currentUser,
    isLoading: status === "loading" || isLoadingUser,
    isAuthenticated: status === "authenticated",
  };
};

/**
 * Hook customizado para verificar se o utilizador logado possui uma permissão específica.
 */
export const useCan = (permission: UserPermission): boolean => {
  const { user, isAuthenticated } = useCurrentUser();

  if (!isAuthenticated || !user?.permissions) {
    return false;
  }

  return user.permissions.includes(permission);
};
