"use client";
import { useMemo, useState, useCallback } from "react";
import useSWR, { mutate as globalMutate } from "swr";
import {
  AvailabilitySlot,
  AvailabilityException,
} from "@/types/time/availability";
import {
  PopulatedStudentClass,
  StudentClass,
  TeacherAvailability,
} from "@/types/classes/class";
import { toast } from "sonner";

type StudentAvailabilityState = {
  slots: AvailabilitySlot[];
  exceptions: AvailabilityException[];
  bookedClasses: StudentClass[];
};

type StudentClassesResponse = {
  success?: boolean;
  data?: PopulatedStudentClass[];
  total?: number;
};

type RescheduleInfo = {
  allowed: boolean;
  count: number;
  limit: number;
};

async function jsonFetcher<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const message =
      (body && (body.error || body.message)) || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return (body ?? null) as T;
}

export const useStudent = () => {
  const [isMutating, setIsMutating] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [availabilityTeacherId, setAvailabilityTeacherId] = useState<
    string | null
  >(null);

  const availabilityKey = useMemo(() => {
    if (!availabilityTeacherId) return null;
    return `/api/student/availability?teacherId=${encodeURIComponent(
      availabilityTeacherId,
    )}`;
  }, [availabilityTeacherId]);

  const {
    data: availabilityData,
    error: availabilityError,
    isLoading: isAvailabilityLoading,
  } = useSWR<StudentAvailabilityState>(availabilityKey, jsonFetcher, {
    keepPreviousData: true,
  });

  const {
    data: myClassesResponse,
    error: myClassesError,
    isLoading: isMyClassesLoading,
  } = useSWR<StudentClassesResponse>("/api/student/my-classes", jsonFetcher, {
    keepPreviousData: true,
  });

  const {
    data: rescheduleInfoData,
    error: rescheduleInfoError,
    isLoading: isRescheduleInfoLoading,
  } = useSWR<RescheduleInfo>("/api/student/can-reschedule", jsonFetcher, {
    keepPreviousData: true,
  });

  const availability: StudentAvailabilityState = useMemo(
    () =>
      availabilityData ?? {
        slots: [],
        exceptions: [],
        bookedClasses: [],
      },
    [availabilityData],
  );

  const myClasses = useMemo(
    () => myClassesResponse?.data ?? [],
    [myClassesResponse?.data],
  );

  const rescheduleInfo: RescheduleInfo = useMemo(
    () => rescheduleInfoData ?? { allowed: false, count: 0, limit: 2 },
    [rescheduleInfoData],
  );

  const error =
    localError ??
    (availabilityError ? availabilityError.message : null) ??
    (myClassesError ? myClassesError.message : null) ??
    (rescheduleInfoError ? rescheduleInfoError.message : null);

  const isLoading =
    isMutating ||
    isAvailabilityLoading ||
    isMyClassesLoading ||
    isRescheduleInfoLoading;

  const fetchAvailability = useCallback(async (teacherId: string) => {
    if (!teacherId) return;
    setLocalError(null);
    setAvailabilityTeacherId(teacherId);
    return globalMutate(
      `/api/student/availability?teacherId=${encodeURIComponent(teacherId)}`,
    );
  }, []);

  const fetchMyClasses = useCallback(async () => {
    setLocalError(null);
    return globalMutate("/api/student/my-classes");
  }, []);

  const bookClass = async (payload: {
    teacherId: string;
    slotId: string;
    scheduledAt: Date;
    startTime: string;
    classTopic: string;
  }): Promise<boolean> => {
    setIsMutating(true);
    setLocalError(null);
    try {
      const response = await fetch("/api/student/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      toast.success("Aula agendada com sucesso!");

      if (payload.teacherId) {
        await fetchAvailability(payload.teacherId);
      }

      await fetchMyClasses();
      return true;
    } catch (err: any) {
      setLocalError(err.message);
      return false;
    } finally {
      setIsMutating(false);
    }
  };

  const cancelClass = async (classId: string, scheduledAt?: Date) => {
    setIsMutating(true);
    setLocalError(null);
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

      toast.success(data.message);

      await fetchMyClasses();
    } catch (err: any) {
      setLocalError(err.message);
      toast.error(`Erro: ${err.message}`);
    } finally {
      setIsMutating(false);
    }
  };

  const checkRescheduleStatus = useCallback(async () => {
    try {
      await globalMutate("/api/student/can-reschedule");
    } catch (err) {
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
    setIsMutating(true);
    setLocalError(null);
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

      await Promise.all([fetchMyClasses(), checkRescheduleStatus()]);
      return true;
    } catch (err: any) {
      setLocalError(`Falha ao reagendar: ${err.message}`);
      return false;
    } finally {
      setIsMutating(false);
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
    const response = await fetch(
      `/api/student/teacher-availability/${encodeURIComponent(teacherId)}`
    );
    if (!response.ok) {
      setLocalError("Não foi possível carregar os horários do professor.");
      return { slots: [], exceptions: [], bookedClasses: [], settings: {} };
    }
    return response.json();
  };

  const bookClassWithCredit = async (
    teacherId: string,
    scheduledAt: Date,
    availabilitySlotId: string,
    creditType: string,
    classTopic?: string,
  ): Promise<boolean> => {
    setIsMutating(true);
    setLocalError(null);
    try {
      const response = await fetch("/api/student/classes/book-with-credit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherId,
          scheduledAt,
          availabilitySlotId,
          creditType,
          classTopic,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      toast.success("Aula agendada com sucesso!");
      await fetchMyClasses();
      return true;
    } catch (err: any) {
      setLocalError(err.message);
      return false;
    } finally {
      setIsMutating(false);
    }
  };

  return {
    isLoading,
    error,
    availability,
    fetchAvailability,
    bookClass,
    bookClassWithCredit,
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
