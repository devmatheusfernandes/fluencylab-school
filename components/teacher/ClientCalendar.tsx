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
  onRefresh?: () => void;
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
    if (event.studentInfo) {
      const fullClassData = allClasses.find(
        (cls) => cls.id === event.id.replace("class-", "")
      );

      if (fullClassData) {
        setSelectedClass(fullClassData);
        setIsClassModalOpen(true);
      }
    } else {
      setSelectedEvent(event);
      setIsSlotDetailsModalOpen(true);
    }
  };

  const handleAddEvent = (date: Date) => {
    setSelectedDate(date);
    setIsSlotModalOpen(true);
  };

  const handleSlotCreated = () => {
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
