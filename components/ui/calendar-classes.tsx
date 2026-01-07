"use client";

import * as React from "react";
import { twMerge } from "tailwind-merge";
import { Button } from "./button";
import { Text } from "./text";
import { daysOfWeek, months } from "@/types/time/times";
import { CalendarEvent, CalendarView } from "@/types/calendar/calendar";
import { ArrowLeft, ArrowRight, PlusIcon, Calendar as CalendarIcon } from "lucide-react";
import { useTranslations } from "next-intl";

export interface CalendarProps {
  events?: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onAddEvent?: (date: Date) => void;
  onDateSelect?: (date: Date) => void;
  selectedDate?: Date;
  className?: string;
  showNavigation?: boolean;
  showTodayButton?: boolean;
  showViewToggle?: boolean;
  defaultView?: CalendarView;
  locale?: string;
  isMobile?: boolean; // Force mobile layout
}

// Helper functions
const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year: number, month: number) => {
  return new Date(year, month, 1).getDay();
};

const isSameDay = (date1: Date, date2: Date) => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

const isToday = (date: Date) => {
  const today = new Date();
  return isSameDay(date, today);
};

const formatDate = (date: Date, locale: string = "pt-BR") => {
  return date.toLocaleDateString(locale, {
    month: "long",
    year: "numeric",
  });
};

const getEventsForDate = (events: CalendarEvent[], date: Date) => {
  return events.filter((event) => {
    return isSameDay(event.date, date);
  });
};

const getEventColorClasses = (color: CalendarEvent["color"]) => {
  const colorMap = {
    primary: "bg-indigo-100 text-indigo-800 border-indigo-200",
    secondary: "bg-purple-100 text-purple-800 border-purple-200",
    success: "bg-emerald-100 text-emerald-800 border-emerald-200",
    warning: "bg-amber-100 text-amber-800 border-amber-200",
    destructive: "bg-rose-100 text-rose-800 border-rose-200",
    info: "bg-cyan-100 text-cyan-800 border-cyan-200",
  };
  return colorMap[color || "primary"];
};

const getWeekDates = (date: Date) => {
  const startOfWeek = new Date(date);
  const day = startOfWeek.getDay();
  const diff = startOfWeek.getDate() - day;
  startOfWeek.setDate(diff);

  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(startOfWeek);
    currentDate.setDate(startOfWeek.getDate() + i);
    weekDates.push(currentDate);
  }
  return weekDates;
};

const getDayHours = () => {
  const hours = [];
  // Start at 8 AM and go until 22 (10 PM)
  for (let i = 8; i <= 22; i++) {
    hours.push(i);
  }
  return hours;
};

// Hook to detect mobile
const useIsMobile = () => {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return isMobile;
};

export const Calendar: React.FC<CalendarProps> = ({
  events = [],
  onEventClick,
  onAddEvent,
  onDateSelect,
  selectedDate,
  className,
  showNavigation = true,
  showTodayButton = true,
  showViewToggle = true,
  defaultView = "month",
  locale = "pt-BR",
  isMobile: forceMobile,
}) => {
  const detectedMobile = useIsMobile();
  const isMobile = forceMobile ?? detectedMobile;
  const tMonths = useTranslations("Months");
  const tDays = useTranslations("Days");
  const tWeekdays = useTranslations("Weekdays");

  const [currentDate, setCurrentDate] = React.useState(() => {
    return selectedDate || new Date();
  });
  // initial state
  const [currentView, setCurrentView] = React.useState<CalendarView>(
    isMobile ? "day" : defaultView
  );

  // keep in sync when mobile changes
  React.useEffect(() => {
    if (isMobile) {
      setCurrentView("day");
    }
  }, [isMobile]);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const goToPreviousPeriod = () => {
    if (currentView === "month") {
      setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    } else if (currentView === "week") {
      const newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() - 7);
      setCurrentDate(newDate);
    } else if (currentView === "day") {
      const newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() - 1);
      setCurrentDate(newDate);
    }
  };

  const goToNextPeriod = () => {
    if (currentView === "month") {
      setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
    } else if (currentView === "week") {
      const newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() + 7);
      setCurrentDate(newDate);
    } else if (currentView === "day") {
      const newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() + 1);
      setCurrentDate(newDate);
    }
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
  };

  const handleDateClick = (date: Date) => {
    onDateSelect?.(date);
  };

  const handleAddEvent = (date: Date) => {
    onAddEvent?.(date);
  };

  const getViewTitle = () => {
    if (currentView === "month") {
      return formatDate(currentDate, locale);
    } else if (currentView === "week") {
      const weekDates = getWeekDates(currentDate);
      const startDate = weekDates[0];
      const endDate = weekDates[6];
      return `${startDate.getDate()} ${
        tMonths(months[startDate.getMonth()])
      } - ${endDate.getDate()} ${tMonths(months[endDate.getMonth()])} ${currentYear}`;
    } else if (currentView === "day") {
      return `${currentDate.getDate()} ${
        tMonths(months[currentDate.getMonth()])
      } ${currentYear}`;
    }
    return "";
  };

  const renderEventBadge = (
    event: CalendarEvent,
    isCompact: boolean = false,
    isTimeline: boolean = false
  ) => {
    // Apply different styling based on compact mode
    const baseClasses = twMerge(
      isCompact
        ? "px-2 py-1 rounded-lg text-xs cursor-pointer transition-all duration-200 hover:shadow-sm border overflow-hidden"
        : "px-3 py-2 rounded-xl text-sm cursor-pointer transition-all duration-200 hover:shadow-md border overflow-hidden",
      getEventColorClasses(event.color)
    );

    // Calculate proportional positioning for timeline view
    let positionStyle = {};
    if (isTimeline && event.startTime && event.endTime) {
      const [startHour, startMinute] = event.startTime.split(":").map(Number);
      const [endHour, endMinute] = event.endTime.split(":").map(Number);

      // Convert to minutes from 8:00 AM (start of day view)
      const dayStartHour = 8;
      const startMinutesFromDayStart =
        (startHour - dayStartHour) * 60 + startMinute;
      const endMinutesFromDayStart = (endHour - dayStartHour) * 60 + endMinute;

      // Determine hour block height based on context (mobile vs desktop)
      const hourBlockHeight = isMobile ? 60 : 80; // min-h-[60px] for mobile, min-h-[80px] for desktop
      const topPosition = (startMinutesFromDayStart / 60) * hourBlockHeight;
      const eventDuration = endMinutesFromDayStart - startMinutesFromDayStart;
      const eventHeight = Math.max((eventDuration / 60) * hourBlockHeight, 24); // Minimum 24px height

      const horizontalPadding = isMobile ? 12 : 16; // p-3 for mobile, p-4 for desktop

      positionStyle = {
        position: "absolute" as const,
        top: `${topPosition}px`,
        height: `${eventHeight}px`,
        left: `${horizontalPadding}px`,
        right: `${horizontalPadding}px`,
        zIndex: 10,
      };
    }

    return (
      <div
        key={event.id}
        className={baseClasses}
        style={positionStyle}
        onClick={(e) => {
          e.stopPropagation();
          onEventClick?.(event);
        }}
      >
        <div
          className={twMerge("font-medium truncate", isCompact && "text-xs")}
        >
          {event.title}
        </div>
        {/* In compact mode, only show time if there's space, hide other details */}
        {!isCompact && event.startTime && event.endTime && (
          <div className="text-xs opacity-70 truncate">
            {event.startTime} - {event.endTime}
          </div>
        )}
        {/* Show time in compact mode only if no person info */}
        {isCompact &&
          event.startTime &&
          event.endTime &&
          !(event.studentInfo?.studentName || event.person) && (
            <div className="text-xs opacity-70 truncate">{event.startTime}</div>
          )}
        {!isCompact && (event.studentInfo?.studentName || event.person) && (
          <div className="text-xs opacity-70 truncate">
            {event.studentInfo?.studentName || event.person}
          </div>
        )}
      </div>
    );
  };

  const renderMobileDayView = () => {
    const dayEvents = getEventsForDate(events, currentDate);
    const hours = getDayHours();

    return (
      <div className="bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Timeline view with proportional positioning */}
        <div className="relative">
          {/* Hour grid background */}
          <div className="divide-y divide-gray-100 dark:divide-slate-700">
            {hours.map((hour) => (
              <div key={hour} className="flex min-h-[60px]">
                {/* Time column */}
                <div className="w-16 flex-shrink-0 p-3 bg-slate-200 dark:bg-slate-800 border-r border-gray-100 dark:border-slate-700">
                  <Text
                    size="sm"
                    className="text-gray-600 dark:text-gray-400 font-medium"
                  >
                    {hour.toString().padStart(2, "0")}:00
                  </Text>
                </div>

                {/* Events column - now just background */}
                <div className="flex-1 p-3">
                  <div className="h-full flex items-center">
                    <div className="w-full border-b border-dashed border-gray-200 dark:border-slate-600"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Absolutely positioned events */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="ml-16 relative h-full pointer-events-auto">
              {dayEvents
                .filter((event) => event.startTime && event.endTime)
                .map((event) => renderEventBadge(event, false, true))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderMonthView = () => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth);

    const calendarDays = [];
    const totalDays = firstDayOfMonth + daysInMonth;
    const weeks = Math.ceil(totalDays / 7);

    for (let week = 0; week < weeks; week++) {
      const weekDays = [];
      for (let day = 0; day < 7; day++) {
        const dayIndex = week * 7 + day;
        const dateNumber = dayIndex - firstDayOfMonth + 1;
        const isValidDate = dateNumber > 0 && dateNumber <= daysInMonth;
        const date = isValidDate
          ? new Date(currentYear, currentMonth, dateNumber)
          : null;
        const dayEvents = date ? getEventsForDate(events, date) : [];
        const isSelected =
          date && selectedDate && isSameDay(date, selectedDate);
        const isCurrentDay = date && isToday(date);

        weekDays.push(
          <div
            key={dayIndex}
            className={twMerge(
              "group relative border border-slate-200 dark:border-slate-700 transition-all duration-200",
              isMobile ? "min-h-[100px] p-2" : "min-h-[140px] p-3",
              isValidDate
                ? "cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600"
                : "bg-slate-50 dark:bg-slate-900 opacity-60",
              isSelected &&
                "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-600 ring-2 ring-indigo-200 dark:ring-indigo-800",
              isCurrentDay &&
                "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-600"
            )}
            onClick={() => date && handleDateClick(date)}
          >
            {isValidDate && (
              <>
                <div className="flex items-center justify-between mb-2">
                  <Text
                    size={isMobile ? "sm" : "base"}
                    className={twMerge(
                      "font-bold transition-colors",
                      isCurrentDay && "text-secondary dark:text-secondary",
                      isSelected && "text-primary dark:text-primary",
                      !isCurrentDay &&
                        !isSelected &&
                        "text-slate-900 dark:text-slate-100"
                    )}
                  >
                    {dateNumber}
                  </Text>
                  {onAddEvent && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className={twMerge(
                        "opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110",
                        isMobile ? "h-6 w-6 p-1" : "h-7 w-7 p-1.5",
                        "text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:text-amber-300 dark:hover:bg-amber-900/30"
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddEvent(date as Date);
                      }}
                    >
                      <PlusIcon
                        className={twMerge(isMobile ? "h-4 w-4" : "h-4 w-4")}
                      />
                    </Button>
                  )}
                </div>

                <div className="space-y-1">
                  {dayEvents
                    .slice(0, isMobile ? 2 : 4)
                    .map((event) => renderEventBadge(event, isMobile))}
                  {dayEvents.length > (isMobile ? 2 : 4) && (
                    <div className="px-2 py-1 text-xs text-slate-600 dark:text-slate-400 font-medium bg-slate-100 dark:bg-slate-800 rounded-md">
                      +{dayEvents.length - (isMobile ? 2 : 4)} mais
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        );
      }
      calendarDays.push(
        <div key={week} className="grid grid-cols-7">
          {weekDays}
        </div>
      );
    }

    return (
      <div className="bg-white/60 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
        <div className="grid grid-cols-7 bg-slate-200 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          {daysOfWeek.map((day) => (
            <div
              key={day}
              className={twMerge(
                "text-center border-r border-slate-200 dark:border-slate-700 last:border-r-0",
                isMobile ? "py-3 px-1" : "py-4 px-3"
              )}
            >
              <Text
                size={isMobile ? "sm" : "base"}
                className="font-bold text-slate-700 dark:text-slate-300"
              >
                {isMobile ? day.slice(0, 3) : day}
              </Text>
            </div>
          ))}
        </div>
        <div>{calendarDays}</div>
      </div>
    );
  };

  const renderWeekView = () => {
    if (isMobile) {
      const weekDates = getWeekDates(currentDate);

      return (
        <div className="space-y-3">
          {weekDates.map((date) => {
            const dayEvents = getEventsForDate(events, date);
            const isSelected = selectedDate && isSameDay(date, selectedDate);
            const isCurrentDay = isToday(date);

            return (
              <div
                key={date.toISOString()}
                className={twMerge(
                  "p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm cursor-pointer transition-all duration-200 hover:shadow-md",
                  isSelected &&
                    "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-600 ring-2 ring-indigo-200 dark:ring-indigo-800",
                  isCurrentDay &&
                    "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-600"
                )}
                onClick={() => handleDateClick(date)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <Text
                      size="lg"
                      className="font-bold text-slate-900 dark:text-slate-100"
                    >
                      {daysOfWeek[date.getDay()]}
                    </Text>
                    <Text
                      size="sm"
                      className="text-slate-600 dark:text-slate-400 font-medium"
                    >
                      {date.getDate()} {months[date.getMonth()]}
                    </Text>
                  </div>
                  {onAddEvent && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:text-amber-300 dark:hover:bg-amber-900/30"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddEvent(date);
                      }}
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Adicionar
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  {dayEvents.length === 0 ? (
                    <Text
                      size="sm"
                      className="text-slate-500 dark:text-slate-400 italic"
                    >
                      Nenhum evento
                    </Text>
                  ) : (
                    dayEvents.map((event) => renderEventBadge(event, false))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    const weekDates = getWeekDates(currentDate);

    return (
      <div className="bg-white/60 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
        <div className="grid grid-cols-8 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <div className="p-4 border-r border-slate-200 dark:border-slate-700">
            <Text
              size="sm"
              className="font-bold text-slate-700 dark:text-slate-300"
            >
              Hora
            </Text>
          </div>
          {weekDates.map((date) => (
            <div
              key={date.toISOString()}
              className="p-4 text-center border-r border-slate-200 dark:border-slate-700 last:border-r-0"
            >
              <Text
                size="sm"
                className="font-bold text-slate-900 dark:text-slate-100"
              >
                {tDays(daysOfWeek[date.getDay()])}
              </Text>
              <Text
                size="xs"
                className="text-slate-600 dark:text-slate-400 font-medium"
              >
                {date.getDate()}
              </Text>
            </div>
          ))}
        </div>

        <div className="max-h-[600px] overflow-y-auto scrollbar-hide no-scrollbar">
          {getDayHours().map((hour) => (
            <div
              key={hour}
              className="grid grid-cols-8 border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="p-3 border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                <Text
                  size="xs"
                  className="text-slate-600 dark:text-slate-400 font-medium"
                >
                  {hour.toString().padStart(2, "0")}:00
                </Text>
              </div>
              {weekDates.map((date) => {
                const dayEvents = getEventsForDate(events, date).filter(
                  (event) =>
                    event.startTime &&
                    parseInt(event.startTime.split(":")[0]) === hour
                );

                return (
                  <div
                    key={date.toISOString()}
                    className="p-2 border-r border-slate-200 dark:border-slate-700 last:border-r-0 min-h-[60px] relative group"
                    onClick={() => handleDateClick(date)}
                  >
                    {dayEvents.map((event) => renderEventBadge(event, true))}
                    {onAddEvent && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-5 w-5 p-1 opacity-0 group-hover:opacity-100 transition-all duration-200 absolute bottom-1 right-1 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:text-amber-300 dark:hover:bg-amber-900/30"
                        onClick={(e) => {
                          e.stopPropagation();
                          const newDate = new Date(date);
                          newDate.setHours(hour);
                          handleAddEvent(newDate);
                        }}
                      >
                        <PlusIcon className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    if (isMobile) {
      return renderMobileDayView();
    }

    const dayEvents = getEventsForDate(events, currentDate);
    const hours = getDayHours();

    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
        <div className="bg-slate-100 dark:bg-slate-800 p-6 border-b border-slate-200 dark:border-slate-700">
          <Text
            size="xl"
            className="font-bold text-slate-900 dark:text-slate-100"
          >
            {daysOfWeek[currentDate.getDay()]}, {currentDate.getDate()}{" "}
            {months[currentDate.getMonth()]} {currentYear}
          </Text>
        </div>

        <div className="max-h-[600px] overflow-y-auto relative">
          {/* Hour grid background */}
          <div>
            {hours.map((hour) => (
              <div
                key={hour}
                className="flex border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="w-24 p-4 bg-slate-50 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700">
                  <Text
                    size="sm"
                    className="font-bold text-slate-700 dark:text-slate-300"
                  >
                    {hour.toString().padStart(2, "0")}:00
                  </Text>
                </div>
                <div className="flex-1 p-4 relative min-h-[80px] group">
                  {onAddEvent && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 p-1 opacity-0 group-hover:opacity-100 transition-all duration-200 absolute bottom-2 right-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:text-amber-300 dark:hover:bg-amber-900/30"
                      onClick={() => {
                        const newDate = new Date(currentDate);
                        newDate.setHours(hour);
                        handleAddEvent(newDate);
                      }}
                    >
                      <PlusIcon className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Absolutely positioned events */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="ml-24 relative h-full pointer-events-auto">
              {dayEvents
                .filter((event) => event.startTime && event.endTime)
                .map((event) => renderEventBadge(event, false, true))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case "month":
        return renderMonthView();
      case "week":
        return renderWeekView();
      case "day":
        return renderDayView();
      default:
        return renderMonthView();
    }
  };

  return (
    <div className={twMerge("w-full mx-auto", className)}>
      {/* Header with date navigation */}
      <div
        className={twMerge(
          "flex items-center justify-between mb-6 px-4",
          isMobile && "flex-col space-y-4"
        )}
      >
        {isMobile ? (
          // Mobile header - horizontal date picker style
          <div className="w-full">
            {/* Week navigation */}
            <div className="flex items-center justify-between gap-4 mb-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={goToPreviousPeriod}
                className="h-10 w-10 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </Button>

              <Text
                size="lg"
                className="font-semibold text-gray-900 dark:text-gray-100 min-w-[120px] text-center"
              >
                {months[currentDate.getMonth()]} de {currentYear}
              </Text>

              <Button
                variant="ghost"
                size="icon"
                onClick={goToNextPeriod}
                className="h-10 w-10 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700"
              >
                <ArrowRight className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </Button>
            </div>

            {/* Week days selector */}
            <div className="flex justify-between gap-1 mb-4">
              {getWeekDates(currentDate).map((date) => {
                const isSelected = isSameDay(date, currentDate);
                const isCurrentDay = isToday(date);

                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => setCurrentDate(date)}
                    className={twMerge(
                      "flex-1 flex flex-col items-center py-3 px-3 rounded-2xl transition-all duration-200",
                      isSelected
                        ? "bg-primary/30 dark:bg-primary text-white shadow-lg"
                        : isCurrentDay
                          ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400"
                          : "bg-gray-50 text-gray-600 hover:bg-gray-100 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                    )}
                  >
                    <Text size="xs" className="font-medium opacity-70 mb-1">
                      {daysOfWeek[date.getDay()].slice(0, 1)}
                    </Text>
                    <Text size="sm" className="font-bold">
                      {date.getDate()}
                    </Text>
                  </button>
                );
              })}
            </div>

            {/* Today and Add Event buttons */}
            <div className="flex justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={goToToday}
                className="px-6 py-2 rounded-full border-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-900/20"
              >
                Hoje
              </Button>
              {onAddEvent && (
                <Button
                  size="sm"
                  onClick={() => onAddEvent(currentDate)}
                  className="px-6 py-2 rounded-full"
                >
                  Adicionar Evento
                </Button>
              )}
            </div>
          </div>
        ) : (
          // Desktop header
          <>
            <div className="flex items-center gap-6">
              {showNavigation && (
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    onClick={goToPreviousPeriod}
                    className="h-11 w-11 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <ArrowLeft className="h-5 w-5 text-slate-700 dark:text-slate-300" />
                  </Button>
                  <Button
                    size="icon"
                    onClick={goToNextPeriod}
                    className="h-11 w-11 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <ArrowRight className="h-5 w-5 text-slate-700 dark:text-slate-300" />
                  </Button>
                </div>
              )}

              <Text
                size="2xl"
                className="capitalize font-bold text-slate-900 dark:text-slate-100"
              >
                {getViewTitle()}
              </Text>
            </div>

            {showViewToggle && (
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700 shadow-sm gap-2">
                <Button size="sm" onClick={() => setCurrentView("month") }>
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Mês
                </Button>
                <Button size="sm" onClick={() => setCurrentView("week")}>
                  Semana
                </Button>
                <Button size="sm" onClick={() => setCurrentView("day")}>
                  Dia
                </Button>
                <Button variant="destructive" size="sm" onClick={goToToday}>
                  Hoje
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Calendar Content */}
      <div className="relative">{renderCurrentView()}</div>
    </div>
  );
};
