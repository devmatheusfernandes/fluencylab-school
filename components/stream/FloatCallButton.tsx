'use client'
import { useCallContext } from "@/context/CallContext";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { Video } from "lucide-react";
import { useState } from "react";

interface FloatCallButtonProps {
  student: { id?: string; studentID?: string } | string;
}

export default function FloatCallButton({ student }: FloatCallButtonProps) {
  const { data: session } = useSession();
  const { callData, startCall, joinCall } = useCallContext();
  const [isHovered, setIsHovered] = useState(false);

  const isTeacher = session?.user.role === "teacher" || session?.user.role === "admin";
  const hasActiveCall = !!callData?.callId;

  const handleClick = () => {
    if (isTeacher) {
      const studentId = (typeof student === 'string'
        ? student
        : (student.id ?? student.studentID ?? '')).trim();
      
      if (studentId) {
        startCall(studentId);
      }
    } else if (hasActiveCall) {
      joinCall(callData!.callId);
    }
  };

  // Se for aluno e não houver chamada, o botão fica em estado desabilitado visualmente
  const isDisabled = !isTeacher && !hasActiveCall;

  return (
    <motion.div
      className="fixed bottom-16 lg:right-12 md:right-5 right-2 z-40"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.button
        className={`flex items-center gap-2 px-4 py-3 rounded-full overflow-hidden transition-all duration-300 shadow-lg ${
          isDisabled
            ? 'bg-white/20 dark:bg-black/20 backdrop-blur-lg border border-white/30 dark:border-white/10 text-slate-400 cursor-not-allowed'
            : 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer'
        }`}
        initial={{ width: 56 }}
        animate={{ width: isHovered ? 180 : 56 }}
        transition={{ type: "spring", stiffness: 360, damping: 28 }}
        onClick={isDisabled ? undefined : handleClick}
        layout
      >
        <motion.div
          className="flex items-center justify-center w-8 h-8"
          animate={!isDisabled ? { scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] } : {}}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <Video className="w-5 h-5" />
        </motion.div>

        <motion.span
          initial={{ opacity: 0, width: 0 }}
          animate={{ 
            opacity: isHovered ? 1 : 0,
            width: isHovered ? "auto" : 0 
          }}
          className="whitespace-nowrap text-sm font-semibold"
        >
          {isTeacher ? "Iniciar aula" : hasActiveCall ? "Entrar na aula" : "Nenhuma aula"}
        </motion.span>
      </motion.button>
    </motion.div>
  );
}
