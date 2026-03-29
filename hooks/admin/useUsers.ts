'use client';

import { useCallback, useMemo, useState } from "react";
import useSWR, { mutate as globalMutate } from "swr";
import { User } from "@/types/users/users";

interface UserFilters {
  role?: string;
  isActive?: boolean;
  search?: string;
}

interface UsersResponse {
  success?: boolean;
  data?: User[];
  total?: number;
}

function buildUsersUrl(filters: UserFilters = {}): string {
  const params = new URLSearchParams();
  if (filters.role) params.append("role", filters.role);
  if (filters.isActive !== undefined) {
    params.append("status", filters.isActive ? "active" : "inactive");
  }
  if (filters.search) params.append("search", filters.search);
  const qs = params.toString();
  return qs ? `/api/admin/users?${qs}` : "/api/admin/users";
}

async function usersFetcher(url: string): Promise<UsersResponse> {
  const response = await fetch(url);
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      (data && (data.error || data.message)) || "Falha ao buscar usuários.";
    throw new Error(message);
  }
  return (data ?? {}) as UsersResponse;
}

export const useUsers = () => {
  const [currentKey, setCurrentKey] = useState<string | null>(null);
  const [isMutating, setIsMutating] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { data, error, isLoading } = useSWR<UsersResponse>(
    currentKey,
    usersFetcher,
    { keepPreviousData: true },
  );

  const users = useMemo(() => data?.data ?? [], [data?.data]);

  const fetchUsers = useCallback(async (filters: UserFilters = {}) => {
    const nextKey = buildUsersUrl(filters);
    setMutationError(null);
    setCurrentKey(nextKey);
    return globalMutate(nextKey);
  }, []);

  const updateUserStatus = async (userId: string, isActive: boolean) => {
    setIsMutating(true);
    setMutationError(null);
    setSuccessMessage(null);
    try {
      let response: Response;

      if (isActive) {
        response = await fetch(`/api/admin/users/${userId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: true }),
        });
      } else {
        response = await fetch(`/api/admin/users/${userId}`, {
          method: "DELETE",
        });
      }

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          (data && (data.error || data.message)) ||
          `Falha ao ${isActive ? "reativar" : "desativar"} usuário.`;
        throw new Error(message);
      }

      const successMsg = `Usuário ${
        isActive ? "reativado" : "desativado"
      } com sucesso.`;
      setSuccessMessage(successMsg);

      if (currentKey) {
        await globalMutate(currentKey);
      }
    } catch (err: any) {
      setMutationError(err.message || "Erro ao atualizar usuário.");
    } finally {
      setIsMutating(false);
    }
  };

  return {
    users,
    isLoading: isLoading || isMutating,
    error: mutationError ?? (error ? error.message : null),
    successMessage,
    fetchUsers,
    updateUserStatus,
  };
};
