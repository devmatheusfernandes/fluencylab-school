'use client'
import { useCallContext } from "@/context/CallContext";
import { Video } from "lucide-react";
import { useSession } from "next-auth/react";
import { Button } from "../ui/button";

interface TeacherCallButtonProps {
    student: {
      studentID: any;
    };
  }
  
export default function TeacherCallButton({ student }: TeacherCallButtonProps) {
    const { data: session } = useSession();
    const { startCall } = useCallContext();
    const createCallId = () => {
        const currentUserId = session?.user.id?.trim();
        const studentId = String(student.studentID ?? '').trim();
        if (!currentUserId || !studentId) return;
        startCall(studentId);
    };

    return(
        <Button variant='glass' className='min-w-max' onClick={createCallId}>Iniciar <Video /></Button>
    )
}
