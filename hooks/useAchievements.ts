// hooks/useAchievements.ts
"use client";

import { useState, useEffect } from "react";
import { StudentAchievement } from "@/types/users/achievements";

interface UseAchievementsResult {
  achievements: StudentAchievement[];
  loading: boolean;
  error: Error | null;
}

export const useAchievements = (userId: string | undefined): UseAchievementsResult => {
  const [achievements, setAchievements] = useState<StudentAchievement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchAchievements = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/student/achievements?id=${userId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch achievements: ${response.status} ${response.statusText}`);
        }
        
        const data: StudentAchievement[] = await response.json();
        setAchievements(data);
      } catch (err) {
        console.error("Error fetching achievements:", err);
        setError(
          err instanceof Error ? err : new Error("Failed to load achievements")
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAchievements();
  }, [userId]);

  return { achievements, loading, error };
};