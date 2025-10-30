import React from "react";
import Link from "next/link";
import { useMessages } from "next-intl";
import { SubContainer } from "../ui/sub-container";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Calendar } from "lucide-react";

interface StudentWithNextClass {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  nextClass: {
    scheduledAt: string | Date;
    language: string;
  } | null;
}

interface StudentCardProps {
  student: StudentWithNextClass;
}

export default function StudentCard({ student }: StudentCardProps) {
  const messages = useMessages();
  const tStudentCard = (messages?.StudentCard ?? {}) as Record<string, string>;

  const formatNextClassDate = (date: string | Date) => {
    try {
      // Convert to Date object if it's a string
      const classDate = typeof date === "string" ? new Date(date) : date;

      // Check if the date is valid
      if (isNaN(classDate.getTime())) {
        return tStudentCard.invalidDate || "Data inválida";
      }

      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Check if it's today
      if (classDate.toDateString() === today.toDateString()) {
        const hours = classDate.getHours().toString().padStart(2, "0");
        const minutes = classDate.getMinutes().toString().padStart(2, "0");
        return `${tStudentCard.classToday || "Aula hoje às"} ${hours}:${minutes}`;
      }

      // Check if it's tomorrow
      if (classDate.toDateString() === tomorrow.toDateString()) {
        return tStudentCard.classTomorrow || "Aula amanhã";
      }

      // Format as day of week + date
      const days = [
        tStudentCard.sunday || "Domingo",
        tStudentCard.monday || "Segunda",
        tStudentCard.tuesday || "Terça",
        tStudentCard.wednesday || "Quarta",
        tStudentCard.thursday || "Quinta",
        tStudentCard.friday || "Sexta",
        tStudentCard.saturday || "Sábado",
      ];
      const dayName = days[classDate.getDay()];
      const day = classDate.getDate();
      const month = classDate.getMonth() + 1;
      const hours = classDate.getHours().toString().padStart(2, "0");
      const minutes = classDate.getMinutes().toString().padStart(2, "0");

      return `${dayName} ${tStudentCard.dayAt || "dia"} ${day}/${month} ${tStudentCard.at || "às"} ${hours}:${minutes}`;
    } catch (error) {
      console.error("Error formatting date:", error);
      return tStudentCard.invalidDate || "Data inválida";
    }
  };

  return (
    <SubContainer className="card-base">
      <Link
        href={`/hub/plataforma/teacher/meus-alunos/${student.id}`}
        className="flex items-center space-x-4"
      >
        <Avatar size="xl">
          <AvatarImage size="xl" src={student.avatarUrl || ""} alt="Usuário" />
          <AvatarFallback name={student.name} />
        </Avatar>

        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg truncate text-foreground">{student.name}</h3>
          <p className="text-muted-foreground text-sm truncate">
            {student.email}
          </p>
          {student.nextClass ? (
            <div className="mt-2 flex flex-row items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              <span className="font-medium text-xs text-foreground">
                {formatNextClassDate(student.nextClass.scheduledAt)}
              </span>
            </div>
          ) : (
            <div className="mt-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                {tStudentCard.noScheduledClasses || "Sem aulas agendadas"}
              </span>
            </div>
          )}
        </div>
      </Link>
    </SubContainer>
  );
}
