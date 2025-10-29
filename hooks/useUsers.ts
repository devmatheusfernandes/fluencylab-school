'use client';

import { useState, useCallback } from "react";
import { User } from "@/types/users/users";

interface UserFilters {
  role?: string;
  isActive?: boolean;
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
      if (filters.isActive !== undefined) params.append('isActive', String(filters.isActive));

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
    setSuccessMessage(null); // Limpa a mensagem de sucesso anterior
    try {
      const method = isActive ? 'PUT' : 'DELETE';
      const response = await fetch(`/api/admin/users/${userId}`, { method });
      if (!response.ok) throw new Error(`Falha ao ${isActive ? 'reativar' : 'desativar'} usuário.`);
      
      const successMsg = `Usuário ${isActive ? 'reativado' : 'desativado'} com sucesso.`;
      setSuccessMessage(successMsg); // Define a nova mensagem de sucesso

      // Recarrega a lista de usuários para refletir a mudança
      await fetchUsers(); 
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return { users, isLoading, error, successMessage, fetchUsers, updateUserStatus };
};
