'use client';
import { Payment } from '@/types/financial/payments';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

// 1. A lógica de busca de dados foi movida para um hook customizado
export const useUserFinancials = (userId: string) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const fetchFinancials = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/admin/users/${userId}/financials`);
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Falha ao buscar dados financeiros.');
        }
        const data = await response.json();
        setPayments(data);
      } catch (error: any) {
        toast.error(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFinancials();
  }, [userId]);

  return { payments, isLoading };
};
