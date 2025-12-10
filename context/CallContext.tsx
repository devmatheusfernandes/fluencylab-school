import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useSession } from "next-auth/react";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from '@/lib/firebase/config';

type CallData = {
  callId: string;
};

type CallContextType = {
  callData: CallData | null;
  setCallData: (data: CallData | null) => void;
  startCall: (studentId: string) => Promise<string | null>;
  joinCall: (callId: string) => void;
};

const CallContext = createContext<CallContextType | undefined>(undefined);

export const CallProvider = ({ children }: { children: React.ReactNode }) => {
  const [callData, setCallData] = useState<CallData | null>(null);
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.user.role !== 'student' || !session?.user?.id) {
      return;
    }
    const studentRef = doc(db, 'users', session.user.id);
    const unsubscribe = onSnapshot(
      studentRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const callId = data.callId;
          if (typeof callId === 'undefined' || callId === null) {
            setCallData(null);
          } else {
            setCallData({ callId });
          }
        } else {
          console.error("Documento do aluno não encontrado.");
        }
      },
      (error) => {
        console.error("Erro ao buscar callId:", error);
      }
    );
    return () => unsubscribe();
  }, [session?.user?.id, session?.user?.role]);

  const value = useMemo(() => ({ callData, setCallData }), [callData]);
  const startCall = async (studentId: string): Promise<string | null> => {
    try {
      const body = { studentId };
      const res = await fetch('/api/calls/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        return null;
      }
      const data = await res.json();
      const id = data.callId as string;
      if (id) setCallData({ callId: id });
      return id ?? null;
    } catch {
      return null;
    }
  };

  const joinCall = (id: string) => {
    if (!id) return;
    setCallData({ callId: id });
  };

  return (
    <CallContext.Provider value={{ ...value, startCall, joinCall }}>
      {children}
    </CallContext.Provider>
  );
};

export const useCallContext = () => {
  const context = useContext(CallContext);
  if (!context) throw new Error("useCallContext must be used within a CallProvider");
  return context;
};
