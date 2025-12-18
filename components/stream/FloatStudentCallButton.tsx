'use client'
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { motion } from "framer-motion";
import { db } from "@/lib/firebase/config";
import { useCallContext } from "@/context/CallContext";
import { Video } from "lucide-react";

interface FloatStudentCallButtonProps {
  student: { id?: string; studentID?: string } | string;
}

export default function FloatStudentCallButton({ student }: FloatStudentCallButtonProps) {
  const { data: session } = useSession();
  const { joinCall } = useCallContext();
  const [firebaseCallId, setFirebaseCallId] = useState<any | null>(null);
  const [isHovered, setIsHovered] = useState(false);

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
        console.error("Erro ao buscar callID:", error);
      }
    );
    return () => unsubscribe();
  }, [session?.user?.id]);

  const createCallId = () => {
    if (!firebaseCallId) return;
    joinCall(firebaseCallId);
  };

  return (
    <motion.div
      className="fixed bottom-16 lg:right-12 md:right-5 right-2 z-40"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.button
        className={`flex items-center gap-2 px-4 py-3 rounded-full overflow-hidden ${
          firebaseCallId
            ? 'bg-primary/80 hover:bg-primary cursor-pointer text-white shadow-lg'
            : 'bg-white/20 dark:bg-black/20 backdrop-blur-lg border border-white/30 dark:border-white/10 text-fluency-gray-800 dark:text-fluency-gray-100 hover:bg-white/30 hover:dark:bg-black/30 hover:border-white/50 dark:hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-colors duração-300 shadow-[0_4px_12px_rgba(0,0,0,0.05)] cursor-not-allowed'
        }`}
        initial={{ width: 56 }}
        animate={{ width: isHovered ? 180 : 56 }}
        transition={{ type: "spring", stiffness: 360, damping: 28, duration: 0.22 }}
        onClick={firebaseCallId ? createCallId : undefined}
        layout
      >
        <motion.div
          className="flex items-center justify-center rounded-full w-8 h-8"
          animate={
            firebaseCallId
              ? { scale: [1, 1.12, 1], rotate: [0, 4, -4, 0] }
              : { scale: 1, rotate: 0 }
          }
          transition={
            firebaseCallId
              ? { duration: 1.4, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }
              : { duration: 0 }
          }
          layout
        >
          <Video className="w-5 h-5" />
        </motion.div>

        <motion.span
          initial={{ opacity: 0, width: 0 }}
          animate={{ 
            opacity: isHovered ? 1 : 0,
            width: isHovered ? "auto" : 0 
          }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="whitespace-nowrap text-sm font-medium"
        >
          {firebaseCallId ? "Clique para entrar" : "Nenhuma chamada"}
        </motion.span>
      </motion.button>
    </motion.div>
  );
}
