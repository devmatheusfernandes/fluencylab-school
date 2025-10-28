'use client';

import { useSession } from "next-auth/react";
import { UserPermission } from "@/types/users/userPermissions";
import { FullUserDetails } from "@/types/users/user-details"; // Importa o tipo completo
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
    const fetchFullUser = async () => {
      // Apenas busca o perfil se a sessão estiver autenticada
      if (status === 'authenticated') {
        setIsLoadingUser(true);
        try {
          const response = await fetch('/api/users/me');
          if (!response.ok) {
            throw new Error('Falha ao buscar o perfil completo do utilizador.');
          }
          const userProfile: FullUserDetails = await response.json();
          // Atualiza o estado com o perfil completo do banco de dados
          setCurrentUser(userProfile);
        } catch (error) {
          console.error(error);
          // Em caso de erro, usa os dados da sessão como fallback para evitar que a UI quebre
          setCurrentUser(session.user as FullUserDetails);
        } finally {
            setIsLoadingUser(false);
        }
      } else if (status !== 'loading') {
        // Se não estiver autenticado nem a carregar, limpa o utilizador
        setCurrentUser(null);
        setIsLoadingUser(false);
      }
    };

    fetchFullUser();
  }, [status, session]); // Roda sempre que o status da sessão muda

  return {
    // Retorna o utilizador completo do Firestore
    user: currentUser,
    // O status geral de carregamento considera tanto a sessão quanto a busca do perfil
    isLoading: status === 'loading' || isLoadingUser,
    isAuthenticated: status === 'authenticated',
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
