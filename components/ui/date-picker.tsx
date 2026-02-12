import { ArrowLeft, ArrowRight, Calendar, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { daysOfWeek, months } from "@/types/time/times";

interface DatePickerProps {
  value?: Date | null;
  onChange?: (date: Date) => void;
  placeholder?: string;
  minDate?: Date | null;
  maxDate?: Date | null;
  disabled?: boolean;
  size?: "sm" | "default" | "lg";
  required?: boolean;
}

export default function DatePicker({
  value,
  onChange,
  placeholder,
  minDate = null,
  maxDate = null,
  disabled = false,
  size = "default",
}: DatePickerProps) {
  const t = useTranslations("DatePicker");
  const tMonths = useTranslations("Months");
  const tWeekdays = useTranslations("Weekdays");

  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(value || null);
  const containerRef = useRef<HTMLDivElement>(null);

  const months = [
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december",
  ];

  const weekdays = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];

  const resolvedPlaceholder = placeholder || t("selectDate");

  const sizeClasses = {
    sm: {
      input: "px-3 py-1 text-sm h-9",
      icon: "h-4 w-4",
    },
    default: {
      input: "px-4 py-1 text-sm h-10",
      icon: "h-4 w-4",
    },
    lg: {
      input: "px-4 py-1 text-base h-12",
      icon: "h-5 w-5",
    },
  };

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: Array<{
      date: Date;
      isCurrentMonth: boolean;
      isDisabled: boolean;
    }> = [];

    // Previous month's trailing days
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const day = new Date(year, month, -i);
      days.push({
        date: day,
        isCurrentMonth: false,
        isDisabled: isDateDisabled(day),
      });
    }

    // Current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      days.push({
        date,
        isCurrentMonth: true,
        isDisabled: isDateDisabled(date),
      });
    }

    // Next month's leading days
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      days.push({
        date,
        isCurrentMonth: false,
        isDisabled: isDateDisabled(date),
      });
    }

    return days;
  };

  const isDateDisabled = (date: Date) => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  const isSameDate = (date1: Date | null, date2: Date | null) => {
    if (!date1 || !date2) return false;
    return date1.toDateString() === date2.toDateString();
  };

  const isToday = (date: Date) => {
    return isSameDate(date, new Date());
  };

  const handleDateClick = (date: Date) => {
    if (isDateDisabled(date)) return;

    setSelectedDate(date);
    if (onChange) {
      onChange(date);
    }
    setIsOpen(false);
  };

  const navigateMonth = (direction: number) => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const navigateYear = (direction: number) => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setFullYear(prev.getFullYear() + direction);
      return newDate;
    });
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleTodayClick = () => {
    const today = new Date();
    setSelectedDate(today);
    if (onChange) {
      onChange(today);
    }
    setCurrentDate(today);
    setIsOpen(false);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const days = getDaysInMonth(currentDate);
  const currentSize = sizeClasses[size];

  return (
    <>
      {/* Input Field */}
      <div
        className="relative group w-full max-w-full mx-auto"
        ref={containerRef}
      >
        <input
          type="text"
          readOnly
          value={formatDate(selectedDate)}
          placeholder={resolvedPlaceholder}
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(true)}
          className={`
              input-base
              w-full duration-150 ease-in-out transition-all rounded-lg border 
              border-gray-200/50 dark:border-gray-700/50 
              bg-gray-300/80 dark:bg-gray-900/35 
              hover:border-gray-300 dark:hover:border-gray-600
              focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-blue-400/30
              focus:border-blue-400/60 dark:focus:border-blue-400/60
              disabled:opacity-50 disabled:cursor-not-allowed 
              cursor-pointer text-gray-900 dark:text-gray-100 
              placeholder-gray-500 dark:placeholder-gray-400
              ${currentSize.input}
            `}
        />
        <Calendar
          size={currentSize.icon === "h-6 w-6" ? 20 : 16}
          className={`
              absolute right-3 top-1/2 transform -translate-y-1/2 
              transition-colors duration-150
              ${
                disabled
                  ? "text-gray-400 dark:text-gray-600"
                  : "text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300"
              }
              pointer-events-none
            `}
        />
      </div>

      {/* Bottom Sheet Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
            onClick={handleClose}
          />

          {/* Bottom Sheet */}
          <div
            className={`
                relative w-full max-w-lg mx-4 mb-4 sm:mb-6
                bg-white/95 dark:bg-gray-900/95 
                backdrop-blur-xl
                rounded-2xl shadow-2xl
                border border-gray-200/50 dark:border-gray-700/50
                transform transition-all duration-300 ease-out
                animate-in slide-in-from-bottom-4 fade-in-0
              `}
          >
            {/* Handle Bar */}
            <div className="flex justify-center pt-4 pb-2">
              <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
            </div>

            {/* Header with Close Button */}
            <div className="flex items-center justify-between px-6 pb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {t("selectDate")}
              </h3>
              <button
                onClick={handleClose}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 
                           transition-colors duration-150 text-gray-500 dark:text-gray-400"
              >
                <X size={20} />
              </button>
            </div>

            {/* Calendar Header */}
            <div className="flex items-center justify-between px-6 pb-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigateYear(-1)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 
                             rounded-lg transition-colors duration-150 
                             text-gray-600 dark:text-gray-400"
                  type="button"
                >
                  <ArrowLeft size={16} />
                </button>

                <button
                  onClick={() => navigateMonth(-1)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 
                             rounded-lg transition-colors duration-150
                             text-gray-700 dark:text-gray-300"
                  type="button"
                >
                  <ArrowLeft size={18} />
                </button>
              </div>

              <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {tMonths(months[currentDate.getMonth()])}{" "}
                {currentDate.getFullYear()}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigateMonth(1)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 
                             rounded-lg transition-colors duration-150
                             text-gray-700 dark:text-gray-300"
                  type="button"
                >
                  <ArrowRight size={18} />
                </button>

                <button
                  onClick={() => navigateYear(1)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 
                             rounded-lg transition-colors duration-150
                             text-gray-600 dark:text-gray-400"
                  type="button"
                >
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 px-6 pb-2">
              {daysOfWeek.map((day) => (
                <div
                  key={day}
                  className="p-3 text-center text-sm font-semibold 
                             text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  {tWeekdays(day)}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 px-6 gap-1 pb-6">
              {days.map((day, index) => {
                const isSelected = isSameDate(day.date, selectedDate);
                const isTodayDate = isToday(day.date);

                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleDateClick(day.date)}
                    disabled={day.isDisabled}
                    className={`
                        relative h-12 w-full rounded-xl text-base font-medium 
                        transition-all duration-200 touch-manipulation
                        focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-blue-400/50
                        ${
                          !day.isCurrentMonth
                            ? "text-gray-300 dark:text-gray-600 hover:text-gray-400 dark:hover:text-gray-500"
                            : "text-gray-700 dark:text-gray-200"
                        }
                        ${
                          isSelected
                            ? "bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white shadow-lg shadow-blue-500/30 dark:shadow-blue-600/20 scale-105"
                            : ""
                        }
                        ${
                          isTodayDate && !isSelected
                            ? "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 text-blue-700 dark:text-blue-300 ring-2 ring-blue-200 dark:ring-blue-600/50"
                            : ""
                        }
                        ${
                          day.isDisabled
                            ? "cursor-not-allowed opacity-30"
                            : "cursor-pointer"
                        }
                        ${
                          !day.isDisabled && !isSelected && !isTodayDate
                            ? "hover:bg-gray-100 dark:hover:bg-gray-800 hover:scale-105 active:scale-95"
                            : ""
                        }
                      `}
                  >
                    {day.date.getDate()}
                  </button>
                );
              })}
            </div>

            {/* Footer Actions */}
            <div className="flex gap-3 px-6 pb-6 pt-2 border-t border-gray-200/50 dark:border-gray-700/50">
              <button
                type="button"
                onClick={handleTodayClick}
                className="flex-1 px-6 py-3 text-base font-semibold 
                           text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300
                           bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-800/40
                           rounded-xl transition-all duration-150
                           border border-blue-200/50 dark:border-blue-600/50 
                           hover:border-blue-300/70 dark:hover:border-blue-500/70
                           active:scale-95 touch-manipulation"
              >
                {t("today")}
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-6 py-3 text-base font-semibold 
                           text-gray-700 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-200
                           bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700
                           rounded-xl transition-all duration-150
                           border border-gray-200/50 dark:border-gray-600/50 
                           hover:border-gray-300/70 dark:hover:border-gray-500/70
                           active:scale-95 touch-manipulation"
              >
                {t("cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
