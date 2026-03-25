import { useState, useEffect } from "react";
import { db } from "@/lib/firebase/config";
import { doc, onSnapshot } from "firebase/firestore";
import { FiscalYear } from "@/types/financial/financial";

export function useFiscalYear(year: number) {
  const [data, setData] = useState<FiscalYear | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const docRef = doc(db, "fiscal_years", year.toString());

    const unsub = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setData(docSnap.data() as FiscalYear);
        } else {
          setData(null);
        }
        setLoading(false); // Sucesso: finaliza o loading
      },
      (err) => {
        console.error(`Erro ao escutar o ano fiscal ${year}:`, err);
        setError(
          err instanceof Error
            ? err
            : new Error("Erro desconhecido no Firestore"),
        );
        setLoading(false);
      },
    );

    return () => unsub();
  }, [year]);

  return { data, loading, error };
}
