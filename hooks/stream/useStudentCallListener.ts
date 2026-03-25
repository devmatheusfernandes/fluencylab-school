import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export type CallData = {
  callId: string;
};

export const useStudentCallListener = () => {
  const { data: session, status } = useSession();
  const [callData, setCallData] = useState<CallData | null>(null);

  useEffect(() => {
    if (status === "loading") return;

    const userId = session?.user?.id;
    const userRole = session?.user?.role;

    if (userRole !== "student" || !userId) {
      setCallData(null);
      return;
    }

    const studentRef = doc(db, "users", userId);

    const unsubscribe = onSnapshot(
      studentRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setCallData(data.callId ? { callId: data.callId } : null);
        } else {
          console.error("Documento do aluno não encontrado.");
          setCallData(null);
        }
      },
      (error) => {
        console.error("Erro ao buscar callId no Firestore:", error);
      },
    );

    return () => unsubscribe();
  }, [session?.user?.id, session?.user?.role, status]);

  return { callData, setCallData };
};
