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
import { convertStringToDate } from "@/lib/utils";

interface TeacherSettingsClientProps {
  initialEvents: any[];
  initialClasses: any[];
  initialScheduleData: any;
  teacherId: string;
}

export default function TeacherSettingsClient({
  initialEvents,
  initialClasses,
}: TeacherSettingsClientProps) {
  const [events, setEvents] = useState(initialEvents);
  const [classes, setClasses] = useState(initialClasses);
  const { deleteAvailability } = useTeacher();
  const t = useTranslations("TeacherSchedule.EventTitles");

  const handleRefresh = useCallback(async () => {
    try {
      const [scheduleResponse, classesResponse] = await Promise.all([
        fetch(`/api/teacher/availability`),
        fetch(`/api/teacher/my-classes`),
      ]);

      if (scheduleResponse.ok && classesResponse.ok) {
        const newScheduleData = await scheduleResponse.json();
        const newClassesData = await classesResponse.json();
        const convertedScheduleData = convertStringToDate(newScheduleData);
        const convertedClassesData = convertStringToDate(newClassesData);

        const calendarEvents = [
          ...mapTeacherEventsToCalendar(
            convertedScheduleData.slots,
            convertedScheduleData.exceptions,
            convertedScheduleData.bookedClasses,
            t
          ),
          ...mapTeacherClassesToCalendar(convertedClassesData, t),
        ];

        const serializedEvents = serializeForClientComponent(calendarEvents);
        const serializedClasses =
          serializeForClientComponent(convertedClassesData);

        setEvents(serializedEvents);
        setClasses(serializedClasses);
      }
    } catch (error) {
      console.error("Error refreshing calendar data:", error);
    }
  }, [t]);

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
