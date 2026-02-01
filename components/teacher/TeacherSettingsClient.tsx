"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import ClientCalendar from "@/components/teacher/ClientCalendar";
import {
  mapTeacherEventsToCalendar,
  mapTeacherClassesToCalendar,
} from "@/lib/calendar/utils";
import { serializeForClientComponent } from "@/lib/utils";
import { useTeacher } from "@/hooks/teacher/useTeacher";

// Utility function to convert ISO strings back to Date objects
function convertStringToDate(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === "string") {
    // Check if it's an ISO date string
    if (obj.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
      return new Date(obj);
    }
    return obj;
  }

  if (typeof obj === "object" && !(obj instanceof Date)) {
    if (Array.isArray(obj)) {
      return obj.map((item) => convertStringToDate(item));
    }

    const converted: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        converted[key] = convertStringToDate(obj[key]);
      }
    }
    return converted;
  }

  return obj;
}

interface TeacherSettingsClientProps {
  initialEvents: any[];
  initialClasses: any[];
  initialScheduleData: any;
  teacherId: string;
}

export default function TeacherSettingsClient({
  initialEvents,
  initialClasses,
  initialScheduleData,
}: TeacherSettingsClientProps) {
  const [events, setEvents] = useState(initialEvents);
  const [classes, setClasses] = useState(initialClasses);
  const [scheduleData, setScheduleData] = useState(initialScheduleData);
  const [isLoading, setIsLoading] = useState(false);
  const { deleteAvailability } = useTeacher();
  const t = useTranslations("TeacherSchedule.EventTitles");

  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch updated data
      const [scheduleResponse, classesResponse] = await Promise.all([
        fetch(`/api/teacher/availability`),
        fetch(`/api/teacher/my-classes`),
      ]);

      if (scheduleResponse.ok && classesResponse.ok) {
        const newScheduleData = await scheduleResponse.json();
        const newClassesData = await classesResponse.json();

        // Convert ISO strings back to Date objects
        const convertedScheduleData = convertStringToDate(newScheduleData);
        const convertedClassesData = convertStringToDate(newClassesData);

        // Re-process the calendar events
        const calendarEvents = [
          ...mapTeacherEventsToCalendar(
            convertedScheduleData.slots,
            convertedScheduleData.exceptions,
            convertedScheduleData.bookedClasses,
            t
          ),
          ...mapTeacherClassesToCalendar(convertedClassesData, t),
        ];

        // Serialize data for client component
        const serializedEvents = serializeForClientComponent(calendarEvents);
        const serializedClasses =
          serializeForClientComponent(convertedClassesData);
        const serializedScheduleData = serializeForClientComponent(
          convertedScheduleData
        );

        // Update state
        setEvents(serializedEvents);
        setClasses(serializedClasses);
        setScheduleData(serializedScheduleData);
      }
    } catch (error) {
      console.error("Error refreshing calendar data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="w-full mt-4">
      <ClientCalendar
        events={events}
        allClasses={classes}
        onRefresh={handleRefresh}
        onDeleteAvailability={deleteAvailability}
      />
    </div>
  );
}
