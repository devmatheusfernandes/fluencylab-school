// hooks/useStudentClassActions.ts
"use client";

import { useState, useCallback } from "react";
import { ClassStatus, StudentClass } from "@/types/classes/class";
import {
  AvailabilitySlot,
  AvailabilityException,
} from "@/types/time/availability";

export interface RescheduleOption {
  slotId: string;
  date: Date;
  time: string;
  teacherId: string;
}

export interface CancellationResult {
  success: boolean;
  message: string;
  suggestReschedule: boolean;
  rescheduleInfo?: {
    remainingReschedules: number;
    message: string;
  };
}

// Helper function to generate concrete dates from availability slots
const generateConcreteSlots = (
  slots: AvailabilitySlot[],
  exceptions: AvailabilityException[],
  bookedClasses: any[],
  settings: any,
  classToReschedule?: StudentClass
): RescheduleOption[] => {
  const concreteSlots: RescheduleOption[] = [];
  const now = new Date();

  // Apply teacher's business rules
  const leadTimeHours = settings?.bookingLeadTimeHours || 24;
  const horizonDays = settings?.bookingHorizonDays || 30;

  const minBookingDate = new Date(
    now.getTime() + leadTimeHours * 60 * 60 * 1000
  );
  const maxBookingDate = new Date(
    now.getTime() + horizonDays * 24 * 60 * 60 * 1000
  );
  maxBookingDate.setHours(23, 59, 59, 999);

  // Create lookup structures for efficient access
  const exceptionSet = new Set<string>();
  exceptions.forEach((ex) => {
    const date = new Date(ex.date);
    const time = `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
    const key = `${date.toDateString()}-${time}`;
    exceptionSet.add(key);
  });

  const bookedSet = new Set<string>();
  bookedClasses.forEach((booked: any) => {
    const date = new Date(booked.scheduledAt);
    const time = `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
    const key = `${date.toDateString()}-${time}`;
    bookedSet.add(key);
  });

  slots.forEach((slot: AvailabilitySlot) => {
    // Only include makeup slots for rescheduling
    if (slot.type !== "makeup") {
      return;
    }

    const [hour, minute] = slot.startTime.split(":").map(Number);
    const currentDate = new Date(slot.startDate);

    // Loop to generate concrete dates based on recurrence
    let iterations = 0;
    while (currentDate <= maxBookingDate && iterations < 100) {
      // Safety limit
      iterations++;
      const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday...

      // Check if the slot's day of week matches the current loop day
      if (dayOfWeek === new Date(slot.startDate).getDay()) {
        const potentialSlotDate = new Date(currentDate);
        potentialSlotDate.setHours(hour, minute, 0, 0);

        // 1. Validation: Within booking horizon?
        if (
          potentialSlotDate > minBookingDate &&
          potentialSlotDate <= maxBookingDate
        ) {
          // 2. Validation: Is it an exception (teacher cancelled day)?
          const exceptionKey = `${potentialSlotDate.toDateString()}-${slot.startTime}`;
          const isException = exceptionSet.has(exceptionKey);

          // 3. Validation: Is there already a class scheduled at this time?
          const bookedKey = `${potentialSlotDate.toDateString()}-${slot.startTime}`;
          const isBooked = bookedSet.has(bookedKey);

          // 4. Validation: Is this the same time as the class being rescheduled?
          let isSameAsOriginal = false;
          if (classToReschedule) {
            const originalDate = new Date(classToReschedule.scheduledAt);
            const originalTime = `${originalDate.getHours().toString().padStart(2, "0")}:${originalDate.getMinutes().toString().padStart(2, "0")}`;
            isSameAsOriginal =
              potentialSlotDate.toDateString() ===
                originalDate.toDateString() && slot.startTime === originalTime;
          }

          if (!isException && !isBooked && !isSameAsOriginal) {
            concreteSlots.push({
              slotId: slot.id!,
              date: potentialSlotDate,
              time: slot.startTime,
              teacherId: slot.teacherId,
            });
          }
        }
      }

      // Advance to next occurrence based on repetition rule
      if (slot.repeating?.type === "weekly") {
        currentDate.setDate(currentDate.getDate() + 7);
      } else if (slot.repeating?.type === "bi-weekly") {
        currentDate.setDate(currentDate.getDate() + 14);
      } else if (slot.repeating?.type === "monthly") {
        currentDate.setMonth(currentDate.getMonth() + 1);
      } else {
        // For non-repeating slots, we should still check if the original date is valid
        break; // If no repetition, exit loop
      }
    }

    if (iterations >= 100) {
      console.warn("[Safety limit reached for slot]:", slot.id);
    }
  });

  // Sort slots by date (closest to furthest)
  concreteSlots.sort((a, b) => a.date.getTime() - b.date.getTime());

  return concreteSlots;
};

export const useStudentClassActions = (studentId: string) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rescheduleOptions, setRescheduleOptions] = useState<
    RescheduleOption[]
  >([]);
  const [selectedClass, setSelectedClass] = useState<StudentClass | null>(null);

  const checkRescheduleOptions = useCallback(async (classId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Get teacher availability for rescheduling
      const classResponse = await fetch(`/api/student/classes/list`);
      if (!classResponse.ok) throw new Error("Failed to fetch class details");

      const classes = await classResponse.json();
      const targetClass = classes.find((c: StudentClass) => c.id === classId);

      if (!targetClass || !targetClass.teacherId) {
        throw new Error("Class or teacher not found");
      }

      const availabilityResponse = await fetch(
        `/api/student/reschedule-availability?teacherId=${targetClass.teacherId}`
      );
      if (!availabilityResponse.ok)
        throw new Error("Failed to fetch availability");

      const availabilityData = await availabilityResponse.json();

      // Generate concrete reschedule options based on availability slots and rules
      const options: RescheduleOption[] = generateConcreteSlots(
        availabilityData.slots,
        availabilityData.exceptions,
        availabilityData.bookedClasses,
        availabilityData.settings,
        targetClass
      );

      setRescheduleOptions(options);
      setSelectedClass(targetClass);

      return options;
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelClass = useCallback(
    async (
      classId: string,
      scheduledAt?: Date
    ): Promise<CancellationResult> => {
      try {
        setLoading(true);
        setError(null);

        const requestBody: { classId: string; scheduledAt?: string } = {
          classId,
        };
        if (scheduledAt) {
          requestBody.scheduledAt = scheduledAt.toISOString();
        }

        const response = await fetch(`/api/student/classes/cancel`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to cancel class");
        }

        const result = await response.json();
        return result;
      } catch (err: any) {
        setError(err.message);
        return {
          success: false,
          message: err.message,
          suggestReschedule: false,
        };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const rescheduleClass = useCallback(
    async (
      classId: string,
      newScheduledAt: Date,
      availabilitySlotId: string,
      reason?: string
    ) => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/student/classes/reschedule`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            classId,
            newScheduledAt,
            availabilitySlotId,
            reason,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to reschedule class");
        }

        const result = await response.json();
        return result;
      } catch (err: any) {
        setError(err.message);
        return { success: false, error: err.message };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    loading,
    error,
    rescheduleOptions,
    selectedClass,
    checkRescheduleOptions,
    cancelClass,
    rescheduleClass,
  };
};
