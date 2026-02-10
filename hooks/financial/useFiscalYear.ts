import { useState, useEffect } from "react";
import { db } from "@/lib/firebase/config";
import { doc, onSnapshot } from "firebase/firestore";
import { FiscalYear } from "@/types/financial/financial";

export function useFiscalYear(year: number) {
  const [data, setData] = useState<FiscalYear | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "fiscal_years", year.toString()), (doc) => {
      if (doc.exists()) {
        setData(doc.data() as FiscalYear);
      } else {
        setData(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [year]);

  return { data, loading };
}
