"use client";

import { useState, useEffect, useCallback } from "react";
import { useStudent } from "@/hooks/student/useStudent";
import { toast } from "sonner";
import { Skeleton } from "../ui/skeleton";
import { Button } from "../ui/button";
import { Calendar, Clock, RefreshCcw } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";

interface NextClassCardProps {
  className?: string;
}

export default function NextClassCard({ className = "" }: NextClassCardProps) {
  const t = useTranslations("NextClassCard");
  const locale = useLocale();
  const { myClasses, fetchMyClasses, isLoading } = useStudent();
  const [nextClass, setNextClass] = useState<{
    type: string;
    isToday: boolean;
    isTomorrow: boolean;
    formattedDate: string;
    time: string;
    daysUntil: number;
  } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const findNextClass = useCallback(() => {
    if (!myClasses || myClasses.length === 0) return null;

    const now = new Date();

    // Filter only scheduled classes that are in the future and sort by date
    const scheduledClasses = myClasses
      .filter((cls) => {
        // Check if class is scheduled/rescheduled and not canceled
        const isValidStatus =
          (cls.status === "scheduled" || cls.status === "rescheduled") &&
          !cls.status.includes("completed");

        // Check if class is in the future
        const classDate = new Date(cls.scheduledAt);
        const isFuture = classDate.getTime() > now.getTime();

        return isValidStatus && isFuture;
      })
      .sort(
        (a, b) =>
          new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
      );

    if (scheduledClasses.length === 0) return null;

    const nextClassData = scheduledClasses[0];
    const classDate = new Date(nextClassData.scheduledAt);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Reset time parts for accurate comparison
    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);
    const classDateWithoutTime = new Date(classDate);
    classDateWithoutTime.setHours(0, 0, 0, 0);

    const isToday = classDateWithoutTime.getTime() === today.getTime();
    const isTomorrow = classDateWithoutTime.getTime() === tomorrow.getTime();

    // Format date
    const formattedDate = classDate.toLocaleDateString(locale, {
      weekday: "long",
      day: "numeric",
      month: "long",
    });

    // Format time
    const time = classDate.toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Calculate days until
    const diffTime = classDateWithoutTime.getTime() - today.getTime();
    const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
      type: nextClassData.rescheduledFrom ? "rescheduled" : "regular",
      isToday,
      isTomorrow,
      formattedDate,
      time,
      daysUntil,
    };
  }, [myClasses, locale]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchMyClasses();
      toast.success(t("refreshSuccess"));
      setIsRefreshing(false);
    } catch (error) {
      console.error("Failed to refresh classes:", error);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    setNextClass(findNextClass());
  }, [myClasses, findNextClass]);

  useEffect(() => {
    fetchMyClasses();
  }, [fetchMyClasses]);

  if (isLoading && !nextClass) {
    return (
      <Skeleton className="p-2">
        <div className="flex justify-between items-start">
          <Skeleton
            className=" h-5 w-24 rounded"
          />
          <Skeleton  className="w-10 h-10 rounded-xl" />
        </div>
        <div className="flex flex-col mt-2 space-y-2">
          <Skeleton
            className=" h-4 w-32 rounded"
          />
          <Skeleton
            className=" h-4 w-24 rounded"
          />
        </div>
      </Skeleton>
    );
  }

  if (!nextClass) {
    return (
      <div className="p-2">
        <div className="flex justify-between items-start">
          <p className="flex-1 w-full rounded">{t("title")}</p>
          <Button
            variant="glass"
            size="icon"
            onClick={handleRefresh}
            aria-label={t("refresh")}
            title={t("refresh")}
          >
            <RefreshCcw className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex-1 w-full">
          <p className="flex-1 w-full rounded ">{t("noClass")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-2">
      <div className="flex justify-between items-start">
        <p className="h-5 w-24 rounded w-full ">{t("title")}</p>
        <Button
          variant="glass"
          size="icon"
          onClick={handleRefresh}
          aria-label={t("refresh")}
          title={t("refresh")}
        >
          {isRefreshing ? (
            <RefreshCcw className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCcw className="w-4 h-4" />
          )}
        </Button>
      </div>

      <div className="mt-2">
        {nextClass.type === "rescheduled" && (
          <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200 mb-2">
            {t("rescheduled")}
          </div>
        )}

        <div className="flex items-center text-paragraph mb-1">
          <Calendar className="w-4 h-4 mr-2" />
          <span className="font-medium">
            {nextClass.isToday
              ? t("today")
              : nextClass.isTomorrow
                ? t("tomorrow")
                : nextClass.formattedDate}
          </span>
        </div>

        <div className="flex items-center text-paragraph">
          <Clock className="w-4 h-4 mr-2" />
          <span>{nextClass.time}</span>
        </div>

        {nextClass.daysUntil > 0 && (
          <div className="mt-2 text-sm text-paragraph">
            {nextClass.daysUntil === 1
              ? t("daysUntil", { count: 1 })
              : t("daysUntilPlural", { count: nextClass.daysUntil })}
          </div>
        )}

        {nextClass.isToday && (
          <div className="mt-2 text-sm font-medium text-teal-500 dark:text-teal-800">
            {t("isToday")}
          </div>
        )}
      </div>
    </div>
  );
}
