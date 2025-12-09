// lib/calendar/calendarUtils.ts
import {
  AvailabilitySlot,
  AvailabilityException,
} from "@/types/time/availability";
import {
  StudentClass,
  ClassStatus,
  PopulatedStudentClass,
} from "@/types/classes/class";
import { CalendarEvent } from "@/types/calendar/calendar";
import { createDateTimeKey } from "@/utils/utils";

/**
 * Maps teacher availability data to calendar events
 * @param slots - Teacher's availability slots
 * @param exceptions - Teacher's availability exceptions
 * @param bookedClasses - Teacher's booked classes
 * @returns CalendarEvent[] - Array of calendar events
 */
export const mapTeacherEventsToCalendar = (
  slots: AvailabilitySlot[],
  exceptions: AvailabilityException[],
  bookedClasses: PopulatedStudentClass[]
): CalendarEvent[] => {
  // console.log("[DEBUG] mapTeacherEventsToCalendar called with:", {
  //   slotsCount: slots?.length || 0,
  //   exceptionsCount: exceptions?.length || 0,
  //   bookedClassesCount: bookedClasses?.length || 0,
  //   slots: slots,
  // });

  const events: CalendarEvent[] = [];

  // Create lookup structures for efficient access
  const bookedKeys = new Map<string, PopulatedStudentClass>();
  const exceptionSet = new Set<string>();

  // Populate booked classes lookup (only scheduled classes)
  bookedClasses.forEach((cls) => {
    if (cls.status === ClassStatus.SCHEDULED) {
      const key = createDateTimeKey(
        cls.scheduledAt,
        cls.scheduledAt.toTimeString().substring(0, 5)
      );
      bookedKeys.set(key, cls);
    }
  });

  // Populate exceptions lookup
  exceptions.forEach((ex) => {
    const date = new Date(ex.date);
    // Use the same time format as slot.startTime for consistency
    const time = `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
    const key = createDateTimeKey(date, time);
    exceptionSet.add(key);
  });

  const now = new Date();
  const threeMonthsFromNow = new Date();
  threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);

  // Process each availability slot
  slots.forEach((slot) => {
    // Generate events based on slot type
    if (slot.repeating) {
      // Handle repeating slots
      const startDate = new Date(slot.startDate);
      const endDate = slot.repeating.endDate
        ? new Date(slot.repeating.endDate)
        : threeMonthsFromNow;

      // Ensure we don't go beyond 3 months
      if (endDate > threeMonthsFromNow) {
        endDate.setTime(threeMonthsFromNow.getTime());
      }

      // Generate occurrences based on repetition type
      const currentDate = new Date(startDate);
      while (currentDate <= endDate && currentDate <= threeMonthsFromNow) {
        // Check if this date is an exception
        const exceptionKey = createDateTimeKey(currentDate, slot.startTime);
        if (!exceptionSet.has(exceptionKey)) {
          // Check if there's a booked class at this time
          const bookedKey = createDateTimeKey(currentDate, slot.startTime);
          const bookedClass = bookedKeys.get(bookedKey);

          if (bookedClass) {
            // Priority 1: Booked class
            events.push({
              id: `class-${bookedClass.id}`,
              title: "Reservado",
              date: new Date(bookedClass.scheduledAt),
              startTime: bookedClass.scheduledAt.toTimeString().substring(0, 5),
              endTime: new Date(
                bookedClass.scheduledAt.getTime() +
                  bookedClass.durationMinutes * 60000
              )
                .toTimeString()
                .substring(0, 5),
              color: "primary",
              classType: bookedClass.classType,
              studentInfo: {
                studentId: bookedClass.studentId,
                studentName: bookedClass.studentName,
                studentAvatarUrl: bookedClass.studentAvatarUrl,
              },
            });
          } else {
            // Priority 3: Available slot
            events.push({
              id: `slot-${slot.id}-${currentDate.getTime()}`,
              title: slot.type === "makeup" ? "Reposição" : "Vago",
              date: new Date(currentDate),
              startTime: slot.startTime,
              endTime: slot.endTime,
              color: "success",
              availabilityType: slot.type,
              // Include the repeating information for the modal
              repeating: {
                type: slot.repeating.type,
                interval: slot.repeating.interval,
                endDate: slot.repeating.endDate,
              },
              slotId: slot.id,
            });
          }
        }

        // Move to next occurrence based on repetition type
        switch (slot.repeating.type) {
          case "weekly":
            currentDate.setDate(
              currentDate.getDate() + 7 * slot.repeating.interval
            );
            break;
          case "bi-weekly":
            currentDate.setDate(
              currentDate.getDate() + 14 * slot.repeating.interval
            );
            break;
          case "monthly":
            currentDate.setMonth(
              currentDate.getMonth() + 1 * slot.repeating.interval
            );
            break;
        }
      }
    } else {
      // Handle single (non-repeating) slots
      const slotDate = new Date(slot.startDate);

      // Only include future events
      if (slotDate >= now && slotDate <= threeMonthsFromNow) {
        // Check if this date is an exception
        const exceptionKey = createDateTimeKey(slotDate, slot.startTime);
        if (!exceptionSet.has(exceptionKey)) {
          // Check if there's a booked class at this time
          const bookedKey = createDateTimeKey(slotDate, slot.startTime);
          const bookedClass = bookedKeys.get(bookedKey);

          if (bookedClass) {
            // Priority 1: Booked class
            events.push({
              id: `class-${bookedClass.id}`,
              title: "Reservado (Reposição)",
              date: new Date(bookedClass.scheduledAt),
              startTime: bookedClass.scheduledAt.toTimeString().substring(0, 5),
              endTime: new Date(
                bookedClass.scheduledAt.getTime() +
                  bookedClass.durationMinutes * 60000
              )
                .toTimeString()
                .substring(0, 5),
              color: "primary",
              classType: bookedClass.classType,
              studentInfo: {
                studentId: bookedClass.studentId,
                studentName: bookedClass.studentName,
                studentAvatarUrl: bookedClass.studentAvatarUrl,
              },
            });
          } else {
            // Priority 3: Available slot
            let slotColor: CalendarEvent["color"] = "success";
            switch (slot.type) {
              case "regular":
                slotColor = "success";
                break;
              case "makeup":
                slotColor = "success";
                break;
            }

            events.push({
              id: `slot-${slot.id}`,
              title: slot.type === "makeup" ? "Reposição" : "Vago",
              date: slotDate,
              startTime: slot.startTime,
              endTime: slot.endTime,
              color: slotColor,
              slotId: slot.id,
              availabilityType: slot.type,
            });
          }
        }
      }
    }
  });

  // console.log(
  //   "[DEBUG] mapTeacherEventsToCalendar generated events:",
  //   events.length,
  //   events
  // );
  return events;
};

/**
 * Maps all teacher classes (including past and cancelled) to calendar events
 * @param classes - All teacher's classes
 * @returns CalendarEvent[] - Array of calendar events
 */
export const mapTeacherClassesToCalendar = (
  classes: PopulatedStudentClass[]
): CalendarEvent[] => {
  const events: CalendarEvent[] = [];

  classes.forEach((cls) => {
    // Map class status to calendar event color
    let color: CalendarEvent["color"] = "primary";
    let title = "Aula";

    switch (cls.status) {
      case ClassStatus.SCHEDULED:
        color = "danger";
        title = "Reservado";
        break;
      case ClassStatus.COMPLETED:
        color = "success";
        title = "Concluído";
        break;
      case ClassStatus.CANCELED_STUDENT:
      case ClassStatus.CANCELED_TEACHER:
      case ClassStatus.CANCELED_TEACHER_MAKEUP:
      case ClassStatus.CANCELED_CREDIT:
        color = "warning";
        title = "Cancelado";
        break;
      case ClassStatus.NO_SHOW:
        color = "warning";
        title = "Falta";
        break;
      case ClassStatus.RESCHEDULED:
        color = "info";
        title = "Reagendado";
        break;
      case ClassStatus.TEACHER_VACATION:
        color = "info";
        title = "Férias";
        break;
      case ClassStatus.OVERDUE:
        color = "secondary";
        title = "Vencido";
        break;
    }

    events.push({
      id: `class-${cls.id}`,
      title: title,
      date: new Date(cls.scheduledAt),
      startTime: cls.scheduledAt.toTimeString().substring(0, 5),
      endTime: new Date(cls.scheduledAt.getTime() + cls.durationMinutes * 60000)
        .toTimeString()
        .substring(0, 5),
      color: color,
      classType: cls.classType,
      studentInfo: {
        studentId: cls.studentId,
        studentName: cls.studentName,
        studentAvatarUrl: cls.studentAvatarUrl,
      },
      status: cls.status,
    });
  });

  return events;
};
