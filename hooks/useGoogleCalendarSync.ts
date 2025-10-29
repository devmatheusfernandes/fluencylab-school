'use client';

import { useState } from 'react';
import { toast } from 'sonner';

export const useGoogleCalendarSync = (studentId: string) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const syncWithGoogleCalendar = async () => {
    if (!studentId || isSyncing) return;

    setIsSyncing(true);
    setError(null);

    try {
      // Call the Google Calendar sync API
      const response = await fetch(`/api/student/google-calendar/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to sync with Google Calendar"
        );
      }

      // Show success message
      toast.success("Tarefas sincronizadas com sucesso com o Google Calendar!");
    } catch (err: any) {
      console.error("Error syncing with Google Calendar:", err);
      setError(err.message || "Failed to sync with Google Calendar");
      toast.error(
        "Erro ao sincronizar com o Google Calendar: " +
          (err.message || "Erro desconhecido")
      );
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    isSyncing,
    error,
    syncWithGoogleCalendar,
  };
};