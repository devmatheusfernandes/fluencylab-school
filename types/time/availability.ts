export enum AvailabilityType {
  MAKEUP = "makeup",
  REGULAR = "regular",
}

// O tipo de cor que o professor pode escolher
export type AvailabilityColor = "primary" | "success" | "info";

export type RepeatingType = "weekly" | "bi-weekly" | "monthly";

export interface AvailabilityException {
  id: string;
  originalSlotId: string;
  teacherId: string;
  date: Date;
}

export interface AvailabilitySlot {
  id?: string;
  teacherId: string;
  title: string;
  type: AvailabilityType;
  color?: AvailabilityColor;
  repeating?: {
    type: RepeatingType;
    interval: number;
    endDate?: Date;
  };
  startDate: Date;
  startTime: string;
  endTime: string;
}
