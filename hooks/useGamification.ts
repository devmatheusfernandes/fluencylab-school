import { useState, useEffect } from 'react';
import { User } from '@/types/users/users';
import { toast } from 'sonner';
import { syncGamificationStats } from '@/actions/practice';

// XP definitions
const XP_REWARDS = {
  EASY: 15,
  GOOD: 10,
  HARD: 5,
  WRONG: 1,
};

// Level calculation: Level = floor(sqrt(XP / 50)) or similar curve
// Let's use a simple linear-ish curve for now or standard formula
const calculateLevel = (xp: number) => Math.floor(Math.sqrt(xp / 25)) + 1;
const calculateNextLevelXp = (level: number) => 25 * Math.pow(level, 2);

interface UseGamificationProps {
  initialUser?: User | null;
}

export function useGamification({ initialUser }: UseGamificationProps = {}) {
  const [gamificationState, setGamificationState] = useState(
    initialUser?.gamification || {
      currentXP: 0,
      level: 1,
      streak: { current: 0, best: 0, lastStudyDate: null },
      studyHeatmap: {},
    }
  );

  const addXP = (amount: number) => {
    setGamificationState((prev) => {
      const newXP = prev.currentXP + amount;
      const newLevel = calculateLevel(newXP);
      
      if (newLevel > prev.level) {
        toast.success(`Parabéns! Você alcançou o nível ${newLevel}! 🎉`);
      }

      return {
        ...prev,
        currentXP: newXP,
        level: newLevel,
      };
    });
  };

  const updateStreak = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    setGamificationState((prev) => {
      const lastDate = prev.streak.lastStudyDate ? new Date(prev.streak.lastStudyDate) : null;
      let newCurrent = prev.streak.current;
      
      if (lastDate) {
        lastDate.setHours(0,0,0,0);
        const diffTime = Math.abs(today.getTime() - lastDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

        if (diffDays === 1) {
          // Consecutive day
          newCurrent += 1;
        } else if (diffDays > 1) {
          // Missed a day (or more)
          newCurrent = 1;
        }
        // If diffDays === 0, same day, do nothing to streak count
      } else {
        // First study ever
        newCurrent = 1;
      }

      // Update Heatmap
      const newHeatmap = { ...prev.studyHeatmap };
      newHeatmap[todayStr] = (newHeatmap[todayStr] || 0) + 1;

      return {
        ...prev,
        streak: {
          current: newCurrent,
          best: Math.max(newCurrent, prev.streak.best),
          lastStudyDate: today,
        },
        studyHeatmap: newHeatmap,
      };
    });
  };

  const syncProgress = async () => {
    // Only sync if we have a user (though initialUser might be null in dev, assume we are logged in)
    // The action handles auth check.
    const result = await syncGamificationStats(gamificationState);
    if (!result.success) {
      console.error("Failed to sync gamification progress");
      // Optional: toast error
    }
  };

  return {
    gamificationState,
    addXP,
    updateStreak,
    calculateNextLevelXp,
    syncProgress,
    XP_REWARDS
  };
}
