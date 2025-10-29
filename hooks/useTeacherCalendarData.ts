// hooks/useTeacherCalendarData.ts
"use client";

import { useState, useCallback } from "react";
import { serializeForClientComponent } from "@/utils/utils";

export const useTeacherCalendarData = (teacherId: string) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch updated data
      const [scheduleResponse, classesResponse] = await Promise.all([
        fetch(`/api/teacher/availability`),
        fetch(`/api/teacher/my-classes`),
      ]);

      if (!scheduleResponse.ok || !classesResponse.ok) {
        throw new Error("Failed to fetch updated data");
      }

      const scheduleData = await scheduleResponse.json();
      const classesData = await classesResponse.json();

      // For now, we'll just return the raw data
      // The mapping and serialization will happen in the component
      return {
        scheduleData,
        classesData,
      };
    } catch (err: any) {
      setError(err.message || "Failed to refresh data");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [teacherId]);

  return {
    isLoading,
    error,
    refreshData,
  };
};
