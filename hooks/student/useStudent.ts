"use client";
import { useState, useCallback } from "react";
import {
  AvailabilitySlot,
  AvailabilityException,
} from "@/types/time/availability";
import {
  PopulatedStudentClass,
  StudentClass,
  TeacherAvailability,
} from "@/types/classes/class";

export const useStudent = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availability, setAvailability] = useState<{
    slots: AvailabilitySlot[];
    exceptions: AvailabilityException[];
    bookedClasses: StudentClass[];
  }>({
    slots: [],
    exceptions: [],
    bookedClasses: [],
  });
  const [myClasses, setMyClasses] = useState<PopulatedStudentClass[]>([]);
  const [rescheduleInfo, setRescheduleInfo] = useState({
    allowed: false,
    count: 0,
    limit: 2,
  });

  const fetchAvailability = useCallback(async (teacherId: string) => {
    if (!teacherId) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/student/availability?teacherId=${teacherId}`
      );
      if (!response.ok) throw new Error("Falha ao buscar horários.");
      const data = await response.json();
      setAvailability(data); // 'data' já contém as 3 listas, agora o tipo corresponde
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchMyClasses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/student/my-classes");
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha ao buscar as aulas.");
      }
      const data = await response.json();
      setMyClasses(data.data || []);
    } catch (err: any) {
      setError(err.message);
      setMyClasses([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const bookClass = async (payload: {
    teacherId: string;
    slotId: string;
    scheduledAt: Date;
    startTime: string;
    classTopic: string;
  }): Promise<boolean> => {
    // Adiciona o tipo de retorno para clareza
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/student/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      alert("Aula agendada com sucesso!");

      if (payload.teacherId) {
        await fetchAvailability(payload.teacherId);
      }

      return true; // 👈 Adicione este retorno em caso de sucesso
    } catch (err: any) {
      setError(err.message);
      // Não mostre o alerta aqui, pois a UI fará isso
      return false; // 👈 Adicione este retorno em caso de falha
    } finally {
      setIsLoading(false);
    }
  };

  const cancelClass = async (classId: string, scheduledAt?: Date) => {
    // Adiciona o parâmetro scheduledAt
    setIsLoading(true);
    setError(null);
    try {
      const requestBody: { classId: string; scheduledAt?: string } = {
        classId,
      };
      if (scheduledAt) {
        requestBody.scheduledAt = scheduledAt.toISOString();
      }

      const response = await fetch(`/api/student/classes/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      alert(data.message);

      // A função agora chama 'fetchMyClasses' internamente após o sucesso
      await fetchMyClasses();
    } catch (err: any) {
      setError(err.message);
      alert(`Erro: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const checkRescheduleStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/student/can-reschedule");
      if (!response.ok) return;
      const data = await response.json();
      setRescheduleInfo(data);
    } catch (err) {
      // Falha silenciosa, não precisa de incomodar o utilizador
    }
  }, []);

  /**
   * Busca os dados de reagendamento para um mês específico.
   * @param monthStr - String no formato "YYYY-MM" (ex: "2024-03")
   * @returns Objeto com informações de reagendamento do mês
   */
  const getUserMonthlyReschedules = useCallback(async (monthStr: string) => {
    try {
      const response = await fetch(
        `/api/student/monthly-reschedules?month=${monthStr}`
      );
      if (!response.ok) {
        // Return default values if API fails
        return { month: monthStr, count: 0, limit: 2 };
      }
      const data = await response.json();
      return data;
    } catch (err) {
      // Return default values on error
      return { month: monthStr, count: 0, limit: 2 };
    }
  }, []);

  /**
   * Solicita o reagendamento de uma aula.
   * @param classId - O ID da aula a ser reagendada.
   * @param newScheduledAt - A nova data e hora da aula.
   * @param reason - O motivo opcional para o reagendamento.
   * @param availabilitySlotId - O ID do slot de disponibilidade usado.
   * @returns {Promise<boolean>} - Retorna true se for bem-sucedido.
   */
  const rescheduleClass = async (
    classId: string,
    newScheduledAt: Date,
    reason?: string,
    availabilitySlotId?: string
  ): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/student/classes/reschedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId,
          newScheduledAt,
          reason,
          availabilitySlotId,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      //("Aula reagendada com sucesso!");
      // Recarrega os dados para refletir as alterações na UI
      await Promise.all([fetchMyClasses(), checkRescheduleStatus()]);
      return true;
    } catch (err: any) {
      setError(`Falha ao reagendar: ${err.message}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Busca a disponibilidade de um professor, incluindo as suas regras de negócio.
   * @param teacherId - O ID do professor cuja disponibilidade será buscada.
   * @returns {Promise<TeacherAvailability>} - Os dados de disponibilidade do professor.
   */
  const fetchTeacherAvailability = async (
    teacherId: string
  ): Promise<TeacherAvailability> => {
    // Esta função não altera o estado do hook, apenas retorna os dados para o componente que a chama.
    const response = await fetch(
      `/api/student/teacher-availability/${teacherId}`
    );
    if (!response.ok) {
      setError("Não foi possível carregar os horários do professor.");
      return { slots: [], exceptions: [], bookedClasses: [], settings: {} };
    }
    return response.json();
  };
  return {
    isLoading,
    error,
    availability,
    fetchAvailability,
    bookClass,
    myClasses,
    fetchMyClasses,
    cancelClass,
    checkRescheduleStatus,
    rescheduleInfo,
    rescheduleClass,
    fetchTeacherAvailability,
    getUserMonthlyReschedules,
  };
};
