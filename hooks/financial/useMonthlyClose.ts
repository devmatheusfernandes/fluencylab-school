import { useState } from "react";
import { closeMonthAction } from "@/actions/financial";

export function useMonthlyClose() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const closeMonth = async (year: number, month: number) => {
    setLoading(true);
    setError(null);
    try {
      await closeMonthAction(year, month);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { closeMonth, loading, error };
}
