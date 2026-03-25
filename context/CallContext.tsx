import { createContext, useContext, useMemo, useCallback } from "react";
import {
  useStudentCallListener,
  CallData,
} from "@/hooks/stream/useStudentCallListener";

type CallContextType = {
  callData: CallData | null;
  setCallData: (data: CallData | null) => void;
  startCall: (studentId: string) => Promise<string | null>;
  endCall: (studentId: string, notebookId?: string | null) => Promise<boolean>;
  joinCall: (callId: string) => void;
};

const CallContext = createContext<CallContextType | undefined>(undefined);

export const CallProvider = ({ children }: { children: React.ReactNode }) => {
  // O hook gerencia toda a complexidade do Firestore silenciosamente aqui
  const { callData, setCallData } = useStudentCallListener();

  const startCall = useCallback(
    async (studentId: string): Promise<string | null> => {
      try {
        const res = await fetch("/api/calls/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentId }),
        });

        if (!res.ok) return null;

        const data = await res.json();
        const id = data.callId as string;

        if (id) setCallData({ callId: id });
        return id ?? null;
      } catch (error) {
        console.error("Erro ao iniciar chamada:", error);
        return null;
      }
    },
    [setCallData],
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
    [callData, setCallData],
  );

  const joinCall = useCallback(
    (id: string) => {
      if (!id) return;
      setCallData({ callId: id });
    },
    [setCallData],
  );

  const value = useMemo(
    () => ({
      callData,
      setCallData,
      startCall,
      endCall,
      joinCall,
    }),
    [callData, setCallData, startCall, endCall, joinCall],
  );

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
};

export const useCallContext = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error("useCallContext must be used within a CallProvider");
  }
  return context;
};
