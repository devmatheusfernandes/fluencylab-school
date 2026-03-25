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

    let unsubscribe: (() => void) | undefined;

    const userId = session?.user?.id;
    const userRole = session?.user?.role;

    if (userRole === "student" && userId) {
      const studentRef = doc(db, "users", userId);
      unsubscribe = onSnapshot(
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
    }

    return () => {
      if (unsubscribe) unsubscribe();
      setCallData(null);
    };
  }, [session?.user?.id, session?.user?.role, status]);

  return { callData, setCallData };
};
