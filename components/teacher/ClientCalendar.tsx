// components/teacher/ClientCalendar.tsx
"use client";

import { Calendar } from "@/components/ui/calendar-classes";
import { useState } from "react";
import ClassDetailsModal from "@/components/teacher/ClassDetailsModal";
import AvailabilitySlotModal from "@/components/teacher/AvailabilitySlotModal";
import AvailabilitySlotDetailsModal from "@/components/teacher/AvailabilitySlotDetailsModal";
import { PopulatedStudentClass } from "@/types/classes/class";
import { CalendarEvent } from "@/types/calendar/calendar";

interface ClientCalendarProps {
  events: CalendarEvent[];
  allClasses: PopulatedStudentClass[];
  onRefresh?: () => void; // Add refresh callback
  onDeleteAvailability?: (
    slotId: string,
    deleteType: "single" | "future",
    occurrenceDate: Date
  ) => Promise<void>;
}

export default function ClientCalendar({
  events,
  allClasses,
  onRefresh,
  onDeleteAvailability,
}: ClientCalendarProps) {
  const [selectedClass, setSelectedClass] =
    useState<PopulatedStudentClass | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null
  );
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [isSlotDetailsModalOpen, setIsSlotDetailsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const handleEventClick = (event: CalendarEvent) => {
    // If this is a class event, show the details modal
    if (event.studentInfo) {
      // Find the full class data from allClasses
      const fullClassData = allClasses.find(
        (cls) => cls.id === event.id.replace("class-", "")
      );

      if (fullClassData) {
        setSelectedClass(fullClassData);
        setIsClassModalOpen(true);
      }
    } else {
      // This is an availability slot event
      setSelectedEvent(event);
      setIsSlotDetailsModalOpen(true);
    }
  };

  const handleAddEvent = (date: Date) => {
    setSelectedDate(date);
    setIsSlotModalOpen(true);
  };

  const handleSlotCreated = () => {
    // Close the modal and trigger refresh if provided
    setIsSlotModalOpen(false);
    if (onRefresh) {
      onRefresh();
    }
  };

  return (
    <>
      <Calendar
        events={events}
        onEventClick={handleEventClick}
        onAddEvent={handleAddEvent}
      />
      <ClassDetailsModal
        isOpen={isClassModalOpen}
        onClose={() => setIsClassModalOpen(false)}
        classData={selectedClass}
        onSlotConverted={onRefresh}
      />
      <AvailabilitySlotDetailsModal
        isOpen={isSlotDetailsModalOpen}
        onClose={() => setIsSlotDetailsModalOpen(false)}
        event={selectedEvent}
        onDelete={onDeleteAvailability}
        onRefresh={onRefresh}
      />
      <AvailabilitySlotModal
        isOpen={isSlotModalOpen}
        onClose={() => setIsSlotModalOpen(false)}
        selectedDate={selectedDate || undefined}
        onSlotCreated={handleSlotCreated}
      />
    </>
  );
}
