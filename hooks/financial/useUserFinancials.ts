"use client";
import { Payment } from "@/types/financial/payments";
import { useEffect } from "react";
import useSWR from "swr";
import { toast } from "sonner";

export const useUserFinancials = (userId: string) => {
  const fetcher = async (url: string): Promise<Payment[]> => {
    const response = await fetch(url);
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const message =
        (data && (data.error || data.message)) ||
        "Falha ao buscar dados financeiros.";
      throw new Error(message);
    }
    return (data ?? []) as Payment[];
  };

  const { data, error, isLoading } = useSWR<Payment[]>(
    userId ? `/api/admin/users/${encodeURIComponent(userId)}/financials` : null,
    fetcher,
    { keepPreviousData: true },
  );

  useEffect(() => {
    if (error) toast.error(error.message);
  }, [error]);

  return { payments: data ?? [], isLoading };
};
