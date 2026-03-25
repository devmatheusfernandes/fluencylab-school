"use client";

import { useSession } from "next-auth/react";
import useSWR from "swr";
import { UserPermission } from "@/types/users/userPermissions";
import { FullUserDetails } from "@/types/users/userDetails";

const fetcher = async (url: string): Promise<FullUserDetails> => {
  const res = await fetch(url);
  if (!res.ok)
    throw new Error("Falha ao buscar o perfil completo do utilizador.");
  return res.json();
};

export const useCurrentUser = () => {
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";

  const {
    data: fullUser,
    isLoading: isFetchingUser,
    error,
  } = useSWR<FullUserDetails>(
    isAuthenticated ? "/api/users/me" : null,
    fetcher,
    {
      fallbackData: session?.user as FullUserDetails | undefined,
      keepPreviousData: true,
    },
  );

  const user = isAuthenticated
    ? fullUser || (session?.user as FullUserDetails)
    : null;

  return {
    user,
    isLoading:
      status === "loading" || (isAuthenticated && isFetchingUser && !fullUser),
    isAuthenticated,
    error,
  };
};

export const useCan = (permission: UserPermission): boolean => {
  const { user, isAuthenticated } = useCurrentUser();

  if (!isAuthenticated || !user?.permissions) return false;

  return user.permissions.includes(permission);
};
