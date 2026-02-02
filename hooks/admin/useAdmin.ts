"use client";

import { UserRoles } from "@/types/users/userRoles";
import { User } from "@/types/users/users";
import { useState } from "react";

interface CreateUserPayload {
  name: string;
  email: string;
  role: UserRoles;
  birthDate?: Date;
  contractStartDate?: Date;
  languages?: string[];
  guardian?: {
    name: string;
    email: string;
    phoneNumber?: string;
    relationship?: string;
  };
}

export const useAdmin = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const createUser = async (payload: CreateUserPayload): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Falha ao criar utilizador.");

      setSuccessMessage(
        `Utilizador para '${result.data.email}' criado com sucesso! Um e-mail de boas-vindas foi enviado.`,
      );
      return true; // Retorna sucesso
    } catch (err: any) {
      setError(err.message);
      return false; // Retorna falha
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (
    userId: string,
    userData: Partial<User>,
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH", // <<< MUDANÇA AQUI
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Falha ao atualizar utilizador.");

      setSuccessMessage("Utilizador atualizado com sucesso!");
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Função para desativar
  const deactivateUser = async (userId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Falha ao desativar utilizador.");
      setSuccessMessage("Utilizador desativado com sucesso!");
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Função para reativar (chama o updateUser com PATCH)
  const reactivateUser = (userId: string): Promise<boolean> => {
    return updateUser(userId, { isActive: true });
  };

  const deleteUser = async (userId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Falha ao deletar utilizador.");

      setSuccessMessage("Utilizador deletado com sucesso!");
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createUser,
    updateUser, // Para atualizações gerais (nome, contrato, etc.)
    deactivateUser, // Para desativar
    reactivateUser, // Para reativar
    deleteUser, // Para deletar (soft delete/desativar via API DELETE)
    isLoading,
    error,
    successMessage,
  };
};
