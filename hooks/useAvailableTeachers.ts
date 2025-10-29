'use client';
import { useState, useEffect, useCallback } from 'react';
import { User } from '@/types/users/users';

export const useAvailableTeachers = (initialFilters: any) => {
  const [teachers, setTeachers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState(initialFilters);

  const fetchTeachers = useCallback(async (currentFilters: any) => {
    setIsLoading(true);
    // Constrói a query string a partir dos filtros
    const params = new URLSearchParams();
    if (currentFilters.language) params.append('language', currentFilters.language);
    if (currentFilters.leadTime) params.append('leadTime', currentFilters.leadTime);

    try {
      const response = await fetch(`/api/student/available-teachers?${params.toString()}`);
      const data = await response.json();
      setTeachers(data);
    } catch (error) {
      console.error("Erro ao buscar professores:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeachers(filters);
  }, [filters, fetchTeachers]);

  return { teachers, isLoading, setFilters };
};