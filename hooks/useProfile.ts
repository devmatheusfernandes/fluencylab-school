'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { User } from '@/types/users/users';

export const useProfile = () => {
  const [isLoading, setIsLoading] = useState(false);

  const updateUserProfile = async (profileData: Partial<User>) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Falha ao atualizar o perfil.');
      }
      
      toast.success('Perfil atualizado com sucesso!');
      return true;
    } catch (error: any) {
      toast.error(error.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { updateUserProfile, isLoading };
};