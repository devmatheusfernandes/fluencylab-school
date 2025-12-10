'use client'
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { useCallContext } from "@/context/CallContext";
import { db } from "@/lib/firebase/config";
import { Button } from "../ui/button";
import { Video, VideoOff } from "lucide-react";

interface StudentCallButtonProps {
  student: {
    studentID: any;
  };
}

export default function StudentCallButton({ student }: StudentCallButtonProps) {
  const { data: session } = useSession();
  const { setCallData } = useCallContext();
  const [firebaseCallId, setFirebaseCallId] = useState<any | null>(null);

  useEffect(() => {
    if (!session?.user?.id) {
      console.error("Sessão não inicializada");
      return;
    }
    const studentRef = doc(db, 'users', session.user.id);
    const unsubscribe = onSnapshot(
      studentRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFirebaseCallId(data.callId);
        } else {
          console.error("Documento do aluno não encontrado.");
        }
      },
      (error) => {
        console.error("Erro ao buscar callId:", error);
      }
    );
    return () => unsubscribe();
  }, [session?.user?.id]);

  const joinCall = () => {
    if (!firebaseCallId) return;
    setCallData({ callId: firebaseCallId });
    console.log('Entrando na chamada:', firebaseCallId);
  };

  return (
    <Button
      variant={`${firebaseCallId ? 'glass' : 'outline'}`}
      className='min-w-max'
      onClick={joinCall}
      disabled={!firebaseCallId} 
    >
      <AnimatePresence mode="wait">
        {firebaseCallId ? (
          <motion.span
            key="em-andamento"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.3 }}
          >
            Em andamento
          </motion.span>
        ) : (
          <motion.span
            key="chamada"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.3 }}
          >
            Nenhuma chamada
          </motion.span>
        )}
      </AnimatePresence>{" "}
      {firebaseCallId ? (
        <motion.div
          className="ml-2"
          style={{ display: 'inline-block' }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
        >
          <Video />
        </motion.div>
      ) : (
        <motion.div
          className="ml-2"
          style={{ display: 'inline-block' }}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <VideoOff />
        </motion.div>
      )}
    </Button>
  );
}
