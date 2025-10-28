// types/classes/class.ts
import { AvailabilitySlot, AvailabilityException } from "../time/availability";
import { daysOfWeek } from "../time/times";
import { User } from "../users/users";

export enum ClassStatus {
  SCHEDULED = "scheduled",
  COMPLETED = "completed",
  CANCELED_STUDENT = "canceled-student",
  CANCELED_TEACHER = "canceled-teacher",
  CANCELED_TEACHER_MAKEUP = "canceled-teacher-makeup", // Teacher cancellation allowing makeup
  CANCELED_ADMIN = "canceled-admin", // Administrative cancellation
  CANCELED_CREDIT = "canceled-credit", // Credit-based class canceled (cannot be rescheduled)
  NO_SHOW = "no-show",
  RESCHEDULED = "rescheduled",
  TEACHER_VACATION = "teacher-vacation",
  OVERDUE = "overdue",
}

export type ClassTemplateDay = {
  id: string;
  day: (typeof daysOfWeek)[number];
  hour: string;
  teacherId: string;
  language: string;
};

export type ClassTemplate = {
  days: ClassTemplateDay[];
};

export type StudentClass = {
  id: string; // id da aula
  studentId: string;
  teacherId?: string;
  language: string; // Campo adicionado conforme checklist

  scheduledAt: Date;
  durationMinutes: number;
  status: ClassStatus;

  canceledAt?: Date;
  canceledBy?: "student" | "teacher" | "system";
  reason?: string;
  classType: "regular" | "makeup";

  // CREDIT-BASED CLASSES
  creditId?: string; // ID of the credit used to create this class
  creditType?: "bonus" | "late-students" | "teacher-cancellation"; // Type of credit used
  isReschedulable?: boolean; // Whether this class can be rescheduled (false for credit classes)

  // CAMPOS ADICIONADOS PARA RASTREAR REAGENDAMENTOS
  rescheduledFrom?: {
    originalClassId: string;
    originalScheduledAt: Date;
  };
  rescheduleReason?: string;

  completedAt?: Date;
  feedback?: string; //TEACHER ADDS A NOTE AFTER CLASS
  notes?: string;

  createdAt: Date;
  updatedAt: Date;

  createdBy: string; // userId who created the class
  availabilitySlotId?: string;

  // CONVERSÃO PARA SLOT DISPONÍVEL
  convertedToAvailableSlot?: boolean; // Se a aula foi convertida em slot disponível
  convertedAt?: Date; // Quando foi convertida
};

// Novo tipo que combina dados da aula com os do aluno
export type PopulatedStudentClass = StudentClass & {
  studentName?: string; // Opcional, usado na visão do professor
  studentAvatarUrl?: string;
  teacherName?: string; // Opcional, usado na visão do aluno
  teacherAvatarUrl?: string;
};

export type FullClassDetails = StudentClass & {
  student: User;
  teacher?: User; // Made teacher optional since it can be null in some cases
};

export type TeacherAvailability = {
  slots: AvailabilitySlot[];
  exceptions: AvailabilityException[];
  bookedClasses: StudentClass[];
  settings?: User["schedulingSettings"];
};
