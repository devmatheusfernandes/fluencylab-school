import { useState, useEffect } from "react";
import {
  AvailabilitySlot,
  AvailabilityException,
} from "@/types/time/availability";

export interface AvailableTimeSlot {
  date: Date;
  availabilitySlotId: string;
  slotTitle: string;
}

export const useTeacherAvailabilityForBooking = (
  isOpen: boolean,
  teacherId: string | null,
  onlyMakeup?: boolean,
) => {
  const [availableSlots, setAvailableSlots] = useState<AvailableTimeSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  useEffect(() => {
    if (!isOpen || !teacherId) {
      setAvailableSlots([]);
      return;
    }

    const loadAvailability = async () => {
      setIsLoadingSlots(true);
      try {
        const response = await fetch(
          `/api/student/availability?teacherId=${teacherId}`,
        );
        if (!response.ok) {
          setAvailableSlots([]);
          setIsLoadingSlots(false);
          return;
        }

        const data = await response.json();
        const { slots, exceptions, bookedClasses } = data;

        // Default settings (fallback)
        const leadTimeHours = 24;
        const horizonDays = 30;

        if (!slots || slots.length === 0) {
          setAvailableSlots([]);
          setIsLoadingSlots(false);
          return;
        }

        const concreteSlots: AvailableTimeSlot[] = [];
        const now = new Date();

        const minBookingDate = new Date(
          now.getTime() + leadTimeHours * 60 * 60 * 1000,
        );
        const maxBookingDate = new Date(
          now.getTime() + horizonDays * 24 * 60 * 60 * 1000,
        );
        maxBookingDate.setHours(23, 59, 59, 999);

        slots.forEach((slot: AvailabilitySlot) => {
          if (onlyMakeup && slot.type !== "makeup") {
            return;
          }

          if (!slot.repeating) {
            const [hour, minute] = slot.startTime.split(":").map(Number);
            const slotDate = new Date(slot.startDate);
            slotDate.setHours(hour, minute, 0, 0);

            if (slotDate > minBookingDate && slotDate <= maxBookingDate) {
              const isException = exceptions.some(
                (ex: AvailabilityException) =>
                  new Date(ex.date).toDateString() === slotDate.toDateString(),
              );

              const isBooked = bookedClasses.some(
                (booked: any) =>
                  new Date(booked.scheduledAt).getTime() === slotDate.getTime(),
              );

              if (!isException && !isBooked) {
                concreteSlots.push({
                  date: slotDate,
                  availabilitySlotId: slot.id!,
                  slotTitle: slot.title || "Horário Disponível",
                });
              }
            }
            return;
          }

          const [hour, minute] = slot.startTime.split(":").map(Number);
          const currentDate = new Date(slot.startDate);

          // Adjust currentDate to start from today/minBookingDate if it's in the past
          // to optimize loop. However, we need to respect the day of week.
          // Simplest is to just iterate.

          let iterations = 0;
          while (currentDate <= maxBookingDate && iterations < 365) {
            iterations++;

            // We only care if currentDate is >= minBookingDate
            // But we need to check if the generated slot date matches

            if (currentDate >= new Date(now.getTime() - 24 * 60 * 60 * 1000)) {
              // Optimization: Start checking near now
              const potentialSlotDate = new Date(currentDate);
              potentialSlotDate.setHours(hour, minute, 0, 0);

              if (
                potentialSlotDate > minBookingDate &&
                potentialSlotDate <= maxBookingDate
              ) {
                const isException = exceptions.some(
                  (ex: AvailabilityException) =>
                    new Date(ex.date).toDateString() ===
                    potentialSlotDate.toDateString(),
                );

                const isBooked = bookedClasses.some(
                  (booked: any) =>
                    new Date(booked.scheduledAt).getTime() ===
                    potentialSlotDate.getTime(),
                );

                if (!isException && !isBooked) {
                  concreteSlots.push({
                    date: potentialSlotDate,
                    availabilitySlotId: slot.id!,
                    slotTitle: slot.title || "Horário Regular",
                  });
                }
              }
            }

            if (slot.repeating?.type === "weekly") {
              currentDate.setDate(currentDate.getDate() + 7);
            } else if (slot.repeating?.type === "bi-weekly") {
              currentDate.setDate(currentDate.getDate() + 14);
            } else if (slot.repeating?.type === "monthly") {
              currentDate.setMonth(currentDate.getMonth() + 1);
            } else {
              break;
            }
          }
        });

        // Sort by date
        concreteSlots.sort((a, b) => a.date.getTime() - b.date.getTime());

        setAvailableSlots(concreteSlots);
      } catch (err: any) {
        console.error("Error loading availability:", err);
        setAvailableSlots([]);
      } finally {
        setIsLoadingSlots(false);
      }
    };

    loadAvailability();
  }, [isOpen, teacherId]);

  return {
    availableSlots,
    isLoadingSlots,
  };
};
