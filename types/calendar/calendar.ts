import { ClassStatus } from "../classes/class";
import { AvailabilityType } from "../time/availability";

// Types for calendar functionality
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: Date;
  startTime?: string;
  endTime?: string;
  color?: "primary" | "secondary" | "success" | "warning" | "danger" | "info";
  isAllDay?: boolean;
  person?: string; // Person responsible for the event
  repeating?: {
    type: "weekly" | "bi-weekly" | "monthly";
    interval: number; // Every X weeks/bi-weeks/months
    endDate?: Date; // When the repetition ends
  };
  location?: string; // Event location
  priority?: "low" | "medium" | "high";
  slotId?: string;
  // Student information for booked classes
  studentInfo?: {
    studentId: string;
    studentName?: string;
    studentAvatarUrl?: string;
  };
  // Class type for booked classes
  classType?: "regular" | "makeup";
  status?: ClassStatus;
  availabilityType?: AvailabilityType;
}

export type CalendarView = "month" | "week" | "day";
