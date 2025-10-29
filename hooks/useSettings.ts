'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { GoogleCalendarDefaultTimes } from '@/types/users/users';

interface SettingsData {
  interfaceLanguage?: string;
  theme?: 'light' | 'dark';
  twoFactorEnabled?: boolean;
  googleCalendarDefaultTimes?: GoogleCalendarDefaultTimes;
}

export const useSettings = () => {
  const { data: session, update } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  const updateSettings = async (settingsData: SettingsData) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsData),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Falha ao salvar as configurações.');
      }
      
      // Update the session with new settings
      if (settingsData.twoFactorEnabled !== undefined) {
        await update({
          ...session,
          user: {
            ...session?.user,
            twoFactorEnabled: settingsData.twoFactorEnabled
          }
        });
      }
      
      toast.success('Configurações salvas com sucesso!');
      // Força um recarregamento da página para aplicar o novo idioma/tema
      if (settingsData.interfaceLanguage || settingsData.theme) {
        window.location.reload(); 
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return { updateSettings, isLoading };
}