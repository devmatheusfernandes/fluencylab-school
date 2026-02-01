'use client';

import { useState, useCallback } from "react";
import { User } from "@/types/users/users";

interface UserFilters {
  role?: string;
  isActive?: boolean;
  search?: string;
}

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchUsers = useCallback(async (filters: UserFilters = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.role) params.append('role', filters.role);
      if (filters.isActive !== undefined) {
        params.append('status', filters.isActive ? 'active' : 'inactive');
      }
      if (filters.search) params.append('search', filters.search);

      const response = await fetch(`/api/admin/users?${params.toString()}`);
      if (!response.ok) throw new Error("Falha ao buscar usuários.");
      
      const result = await response.json();
      setUsers(result.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateUserStatus = async (userId: string, isActive: boolean) => {
    setIsLoading(true);
    setError(null);
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

      await fetchUsers();
    } catch (err: any) {
      setError(err.message || "Erro ao atualizar usuário.");
    } finally {
      setIsLoading(false);
    }
  };

  return { users, isLoading, error, successMessage, fetchUsers, updateUserStatus };
};
