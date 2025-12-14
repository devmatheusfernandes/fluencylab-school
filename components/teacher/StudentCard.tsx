import Link from "next/link";
import { useMessages } from "next-intl";
import { SubContainer } from "../ui/sub-container";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Calendar } from "lucide-react";
import { Card } from "../ui/card";

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
  const slugify = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  const firstName = student.name?.split(" ")[0] ?? student.name;

  const formatNextClassDate = (date: string | Date) => {
    try {
      // Convert to Date object if it's a string
      const classDate = typeof date === "string" ? new Date(date) : date;

      // Check if the date is valid
      if (isNaN(classDate.getTime())) {
        return tStudentCard.invalidDate;
      }

      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Check if it's today
      if (classDate.toDateString() === today.toDateString()) {
        const hours = classDate.getHours().toString().padStart(2, "0");
        const minutes = classDate.getMinutes().toString().padStart(2, "0");
        return `${tStudentCard.classToday} ${hours}:${minutes}`;
      }

      // Check if it's tomorrow
      if (classDate.toDateString() === tomorrow.toDateString()) {
        return tStudentCard.classTomorrow;
      }

      // Format as day of week + date
      const days = [
        tStudentCard.sunday,
        tStudentCard.monday,
        tStudentCard.tuesday,
        tStudentCard.wednesday,
        tStudentCard.thursday,
        tStudentCard.friday,
        tStudentCard.saturday,
      ];
      const dayName = days[classDate.getDay()];
      const day = classDate.getDate();
      const month = classDate.getMonth() + 1;
      const hours = classDate.getHours().toString().padStart(2, "0");
      const minutes = classDate.getMinutes().toString().padStart(2, "0");

      return `${dayName} ${tStudentCard.dayAt} ${day}/${month} ${tStudentCard.at} ${hours}:${minutes}`;
    } catch (error) {
      console.error("Error formatting date:", error);
      return tStudentCard.invalidDate;
    }
  };

  return (
    <Card>
      <Link
        href={`/hub/teacher/my-students/${firstName}?id=${student.id}`}
        className="flex items-center space-x-4"
      >
        <Avatar size="xl">
          <AvatarImage size="xl" src={student.avatarUrl || ""} alt="Usuário" />
          <AvatarFallback name={student.name} />
        </Avatar>

        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg truncate text-primary">
            {firstName}
          </h3>
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
    </Card>
  );
}
