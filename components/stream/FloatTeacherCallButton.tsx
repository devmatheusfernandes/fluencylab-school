'use client'
import { useCallContext } from "@/context/CallContext";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { Video } from "lucide-react";
import { useState } from "react";

interface FloatTeacherCallButtonProps {
  student: { id?: string; studentID?: string } | string;
}

export default function FloatTeacherCallButton({ student }: FloatTeacherCallButtonProps) {
  const { data: session } = useSession();
  const { startCall } = useCallContext();
  const [isHovered, setIsHovered] = useState(false);

  const createCallId = () => {
    const currentUserId = session?.user.id?.trim();
    const studentId = (typeof student === 'string'
      ? student
      : (student.id ?? student.studentID ?? '')).trim();
    if (!currentUserId || !studentId) {
      console.error('IDs inválidos para criação de chamada', { currentUserId, studentId });
      return;
    }
    startCall(studentId);
  };

  return(
    <motion.div
      className="fixed bottom-16 lg:right-10 md:right-5 right-2 z-40"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.button
        className="flex items-center gap-2 px-4 py-3 rounded-full overflow-hidden bg-primary/40 hover:bg-primary cursor-pointer text-white shadow-lg"
        initial={{ width: 56 }}
        animate={{ width: isHovered ? 180 : 56 }}
        transition={{ type: "spring", stiffness: 360, damping: 28, duration: 0.22 }}
        onClick={createCallId}
        layout
      >
        <motion.div
          className="flex items-center justify-center rounded-full w-8 h-8"
          animate={{ scale: [1, 1.12, 1], rotate: [0, 4, -4, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
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
          Iniciar chamada
        </motion.span>
      </motion.button>
    </motion.div>
  )
}
