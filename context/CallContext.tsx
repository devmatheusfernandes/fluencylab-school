import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { useSession } from "next-auth/react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

type CallData = {
  callId: string;
};

type CallContextType = {
  callData: CallData | null;
  setCallData: (data: CallData | null) => void;
  startCall: (studentId: string) => Promise<string | null>;
  endCall: (studentId: string, notebookId?: string | null) => Promise<boolean>;
  joinCall: (callId: string) => void;
};

const CallContext = createContext<CallContextType | undefined>(undefined);

export const CallProvider = ({ children }: { children: React.ReactNode }) => {
  const [callData, setCallData] = useState<CallData | null>(null);
  const { data: session } = useSession();

  useEffect(() => {
    // Apenas alunos precisam do listener do Firestore para receber chamadas
    if (session?.user.role !== "student" || !session?.user?.id) {
      return;
    }

    const studentRef = doc(db, "users", session.user.id);
    const unsubscribe = onSnapshot(
      studentRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const callId = data.callId;
          setCallData(callId ? { callId } : null);
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
  }, [session?.user?.id, session?.user?.role]);

  const startCall = useCallback(
    async (studentId: string): Promise<string | null> => {
      try {
        const body = { studentId };
        const res = await fetch("/api/calls/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          return null;
        }

        const data = await res.json();
        const id = data.callId as string;
        if (id) setCallData({ callId: id });
        return id ?? null;
      } catch (error) {
        console.error("Erro ao iniciar chamada:", error);
        return null;
      }
    },
    [],
  );

  const endCall = useCallback(
    async (studentId: string, notebookId?: string | null): Promise<boolean> => {
      try {
        const res = await fetch("/api/calls/end", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentId,
            notebookId,
            callId: callData?.callId,
          }),
        });

        if (res.ok) {
          setCallData(null);
          return true;
        }
        return false;
      } catch (error) {
        console.error("Erro ao encerrar chamada:", error);
        return false;
      }
    },
    [callData?.callId],
  );

  const joinCall = useCallback((id: string) => {
    if (!id) return;
    setCallData({ callId: id });
  }, []);

  const value = useMemo(
    () => ({
      callData,
      setCallData,
      startCall,
      endCall,
      joinCall,
    }),
    [callData, startCall, endCall, joinCall],
  );

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
};

export const useCallContext = () => {
  const context = useContext(CallContext);
  if (!context)
    throw new Error("useCallContext must be used within a CallProvider");
  return context;
};
