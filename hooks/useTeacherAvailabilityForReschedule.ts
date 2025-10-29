import { useState, useEffect } from "react";
import { PopulatedStudentClass } from "@/types/classes/class";
import { AvailabilitySlot, AvailabilityException } from "@/types/time/availability";

export interface AvailableTimeSlot {
  date: Date;
  availabilitySlotId: string;
  slotTitle: string;
}

export const useTeacherAvailabilityForReschedule = (
  isOpen: boolean,
  classToReschedule: PopulatedStudentClass | null
) => {
  const [availableSlots, setAvailableSlots] = useState<AvailableTimeSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [rawData, setRawData] = useState<{
    slots: AvailabilitySlot[];
    exceptions: AvailabilityException[];
    bookedClasses: any[];
    settings: any;
  } | null>(null);

  useEffect(() => {
    if (!isOpen || !classToReschedule) {
      setAvailableSlots([]);
      setRawData(null);
      return;
    }

    const loadRescheduleAvailability = async () => {
      setIsLoadingSlots(true);
      try {
        // Call the new dedicated API endpoint
        const response = await fetch(`/api/student/reschedule-availability?teacherId=${classToReschedule.teacherId}`);
        if (!response.ok) {
          console.error('Failed to fetch reschedule availability:', response.status, response.statusText);
          setAvailableSlots([]);
          setIsLoadingSlots(false);
          return;
        }
        
        const data = await response.json();
        setRawData(data);
        
        console.log('[useTeacherAvailabilityForReschedule] Raw API Response:', {
          slotsCount: data.slots?.length || 0,
          exceptionsCount: data.exceptions?.length || 0,
          bookedClassesCount: data.bookedClasses?.length || 0,
          settings: data.settings || {},
          sampleSlots: data.slots?.slice(0, 3) // Show first 3 slots for debugging
        });

        const { slots, exceptions, bookedClasses, settings } = data;

        if (!slots || slots.length === 0) {
          console.warn('[useTeacherAvailabilityForReschedule] No slots available for rescheduling');
          setAvailableSlots([]);
          setIsLoadingSlots(false);
          return;
        }

        const concreteSlots: AvailableTimeSlot[] = [];
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

        console.log('[useTeacherAvailabilityForReschedule] Business rules:', {
          leadTimeHours,
          horizonDays,
          minBookingDate: minBookingDate.toISOString(),
          maxBookingDate: maxBookingDate.toISOString()
        });

        slots.forEach((slot: AvailabilitySlot) => {
          // For makeup slots (converted classes), use the original startDate directly
          if (slot.type === 'makeup' || !slot.repeating) {
            const slotDate = new Date(slot.startDate);
            
            // Validation: Within booking horizon?
            if (slotDate > minBookingDate && slotDate <= maxBookingDate) {
              // Validation: Is it an exception?
              const isException = exceptions.some(
                (ex: AvailabilityException) =>
                  new Date(ex.date).toDateString() === slotDate.toDateString()
              );
              
              // Validation: Is there already a class scheduled?
              const isBooked = bookedClasses.some(
                (booked: any) =>
                  new Date(booked.scheduledAt).getTime() === slotDate.getTime()
              );
              
              if (!isException && !isBooked) {
                concreteSlots.push({
                  date: slotDate,
                  availabilitySlotId: slot.id!,
                  slotTitle: slot.title
                });
              }
            }
            return; // Skip the repeating logic for makeup slots
          }
          
          // For regular repeating slots, use the existing logic
          const [hour, minute] = slot.startTime.split(":").map(Number);
          const currentDate = new Date(slot.startDate);

          // Generate concrete dates based on recurrence
          let iterations = 0;
          while (currentDate <= maxBookingDate && iterations < 100) { // Add safety limit
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
                const isException = exceptions.some(
                  (ex: AvailabilityException) =>
                    new Date(ex.date).toDateString() ===
                    potentialSlotDate.toDateString()
                );

                // 3. Validation: Is there already a class scheduled at this time?
                const isBooked = bookedClasses.some(
                  (booked: any) =>
                    new Date(booked.scheduledAt).getTime() ===
                    potentialSlotDate.getTime()
                );

                if (!isException && !isBooked) {
                  concreteSlots.push({
                    date: potentialSlotDate,
                    availabilitySlotId: slot.id!,
                    slotTitle: slot.title
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
            console.warn('[Safety limit reached for slot]:', slot.id);
          }
        });

        console.log('[useTeacherAvailabilityForReschedule] Generated concrete slots:', {
          totalGenerated: concreteSlots.length,
          sampleSlots: concreteSlots.slice(0, 5).map(s => ({
            date: s.date.toISOString(),
            slotId: s.availabilitySlotId,
            title: s.slotTitle
          }))
        });

        setAvailableSlots(concreteSlots);
      } catch (err: any) {
        console.error('[useTeacherAvailabilityForReschedule] Error:', err);
        setAvailableSlots([]);
      } finally {
        setIsLoadingSlots(false);
      }
    };

    loadRescheduleAvailability();
  }, [isOpen, classToReschedule]);

  return {
    availableSlots,
    isLoadingSlots,
    rawData, // Expose raw data for debugging
  };
};