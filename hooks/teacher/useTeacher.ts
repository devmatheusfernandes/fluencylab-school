'use client';

import { useState, useCallback } from "react";
import { AvailabilitySlot, AvailabilityException } from "@/types/time/availability";
import { ClassStatus, PopulatedStudentClass, StudentClass } from "@/types/classes/class";
import { toast } from "sonner";
import { Vacation } from "@/types/time/vacation";

type AddOrUpdatePayload = Partial<Omit<AvailabilitySlot, 'id' | 'teacherId'>>;

export const useTeacher = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [myClasses, setMyClasses] = useState<PopulatedStudentClass[]>([]);
  const [scheduleData, setScheduleData] = useState<{
    slots: AvailabilitySlot[];
    exceptions: AvailabilityException[];
    bookedClasses: StudentClass[];
  }>({ slots: [], exceptions: [], bookedClasses: [] });
 const [vacations, setVacations] = useState<Vacation[]>([]);
 
  /**
   * Busca os dados brutos da agenda para o calendário de disponibilidade.
   */
  const getScheduleData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/teacher/availability');
      if (!response.ok) throw new Error('Falha ao buscar a agenda do professor.');
      
      const data = await response.json();
      setScheduleData({
        slots: data.slots || [],
        exceptions: data.exceptions || [],
        bookedClasses: data.bookedClasses || [],
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Busca a lista de aulas já populada com nomes de alunos para a página "Minhas Aulas".
   */
  const fetchMyClasses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/teacher/my-classes');
      if (!response.ok) throw new Error("Falha ao buscar suas aulas.");
      
      const data: PopulatedStudentClass[] = await response.json();
      setMyClasses(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);


  const addOrUpdateAvailability = async (payload: AddOrUpdatePayload, id?: string) => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const isUpdating = !!id;
      const endpoint = isUpdating ? `/api/teacher/availability/${id}` : '/api/teacher/availability';
      const method = isUpdating ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || `Falha ao ${isUpdating ? 'atualizar' : 'adicionar'} horário.`);
      
      toast.success(`Horário ${isUpdating ? 'atualizado' : 'adicionado'} com sucesso!`);
      await getScheduleData(); // Recarrega os dados da agenda
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

    const deleteAvailability = async (slotId: string, deleteType: 'single' | 'future', occurrenceDate: Date) => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const response = await fetch(`/api/teacher/availability/${slotId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slotId, deleteType, occurrenceDate: occurrenceDate.toISOString() }),
      });
       const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Falha ao deletar horário.");
      
      toast.success("Horário deletado com sucesso.");
      await getScheduleData(); // Recarrega os dados da agenda
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (settings: any) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/teacher/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
       const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Falha ao salvar configurações.");
      toast.success("Configurações salvas com sucesso!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

const updateClassStatus = async (classId: string, newStatus: ClassStatus): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/classes/${classId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      // 1. Atualiza o estado 'myClasses' (PopulatedStudentClass[])
      setMyClasses(prevClasses =>
        prevClasses.map(cls =>
          cls.id === classId ? { ...cls, status: newStatus } : cls
        )
      );

      // 2. CORREÇÃO: Atualiza o estado 'scheduleData.bookedClasses' (StudentClass[]) separadamente
      setScheduleData(prevData => ({
        ...prevData,
        bookedClasses: prevData.bookedClasses.map(cls => 
          cls.id === classId ? { ...cls, status: newStatus } : cls
        )
      }));
      
      toast.success('Status da aula atualizado com sucesso!');
      return true;
    } catch (err: any) {
      toast.error(`Falha ao atualizar status: ${err.message}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMyVacations = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/vacations');
      if (!response.ok) throw new Error("Falha ao buscar períodos de férias.");
      const data = await response.json();
      setVacations(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

   const requestVacation = async (startDate: Date, endDate: Date): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      if (!startDate || !endDate || endDate < startDate) {
        throw new Error("Datas inválidas. A data de término deve ser após a data de início.");
      }
      
      const response = await fetch('/api/vacations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // ▼▼▼ CORREÇÃO AQUI: Enviamos apenas as datas ▼▼▼
        body: JSON.stringify({ startDate, endDate }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      
      setSuccessMessage(result.message);
      
      await fetchMyVacations(); // Recarrega a lista após criar novas férias
      await fetchMyClasses();
      
      return true;
    } catch (err: any) {
      setError(`Falha ao agendar férias: ${err.message}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  return { 
    // Para a Agenda/Calendário
    scheduleData, 
    getScheduleData,
    addOrUpdateAvailability, 
    deleteAvailability, 

    // Para a Lista "Minhas Aulas"
    myClasses,
    fetchMyClasses,
    updateClassStatus,

    // Estados e Funções Gerais
    isLoading, 
    error,
    successMessage, // Mantido caso alguma parte da UI ainda o utilize
    updateSettings,
    requestVacation,
    vacations, 
    fetchMyVacations
  };
};