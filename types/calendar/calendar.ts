import { ClassStatus } from "../classes/class";
import { AvailabilityType } from "../time/availability";

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: Date;
  startTime?: string;
  endTime?: string;
  color?:
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "destructive"
    | "info";
  isAllDay?: boolean;
  person?: string;
  repeating?: {
    type: "weekly" | "bi-weekly" | "monthly";
    interval: number;
    endDate?: Date;
  };
  location?: string;
  priority?: "low" | "medium" | "high";
  slotId?: string;
  studentInfo?: {
    studentId: string;
    studentName?: string;
    studentAvatarUrl?: string;
  };
  classType?: "regular" | "makeup";
  status?: ClassStatus;
  availabilityType?: AvailabilityType;
}

export type CalendarView = "month" | "week" | "day";
