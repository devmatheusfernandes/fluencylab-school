import { useState, useEffect } from "react";
import { db } from "@/lib/firebase/config";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { TeacherPaymentRecord } from "@/types/financial/financial";

export function useTeacherPayments(filters?: { competenceMonth?: string; paymentMonth?: string; teacherId?: string; status?: string }) {
  const [payments, setPayments] = useState<TeacherPaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let q = query(collection(db, "teacher_payments"));

    if (filters?.competenceMonth) {
      q = query(q, where("competenceMonth", "==", filters.competenceMonth));
    }
    if (filters?.paymentMonth) {
      q = query(q, where("paymentMonth", "==", filters.paymentMonth));
    }
    if (filters?.teacherId) {
      q = query(q, where("teacherId", "==", filters.teacherId));
    }
    if (filters?.status) {
        q = query(q, where("status", "==", filters.status));
    }

    const unsub = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TeacherPaymentRecord));
      setPayments(docs);
      setLoading(false);
    });
    return () => unsub();
  }, [filters?.competenceMonth, filters?.paymentMonth, filters?.teacherId, filters?.status]);

  return { payments, loading };
}
