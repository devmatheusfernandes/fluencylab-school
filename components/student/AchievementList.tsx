"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import AchievementCard from "./AchievementCard";
import { useAchievements } from "@/hooks/useAchievements";
import { useRouter } from "next/navigation";
import { Skeleton } from "../ui/skeleton";
import { useTranslations } from "next-intl";

interface AchievementListProps {
  userId: string | undefined;
  limit?: number;
}

const AchievementList: React.FC<AchievementListProps> = ({ userId, limit }) => {
  const { achievements, loading, error } = useAchievements(userId);
  const [filter, setFilter] = useState<"all" | "unlocked" | "locked">("all");
  const router = useRouter();
  const t = useTranslations("AchievementList");

  // Filter achievements based on the selected filter
  const filteredAchievements = achievements.filter((achievement) => {
    if (filter === "all") return true;
    if (filter === "unlocked") return achievement.unlocked;
    if (filter === "locked") return !achievement.unlocked;
    return true;
  });

  // Apply limit if provided
  const displayedAchievements = limit
    ? filteredAchievements.slice(0, limit)
    : filteredAchievements;

  // Reusable grid class to ensure Skeleton and Content match perfectly
  const gridClassName = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4";

  if (loading) {
    return (
      <div className="w-full">
        {/* Skeleton Filters (optional visual placeholder) */}
        {!limit && <div className="flex gap-2 mb-4 overflow-hidden"><Skeleton className="h-10 w-24 rounded-xl" /><Skeleton className="h-10 w-24 rounded-xl" /></div>}
        
        <div className={gridClassName}>
          {Array.from({ length: limit || 6 }).map((_, index) => (
            <div key={index} className="skeleton-base rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
              <div className="flex items-start gap-4">
                <Skeleton className="skeleton-sub w-14 h-14 rounded-lg flex-shrink-0" />
                <div className="flex-1 min-w-0 space-y-2">
                  <Skeleton className="skeleton-sub h-5 w-3/4" />
                  <Skeleton className="skeleton-sub h-4 w-full" />
                  <Skeleton className="skeleton-sub h-3 w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-red-50 border border-red-200 text-red-700 px-4 py-4 rounded-xl shadow-sm dark:bg-red-900/20 dark:border-red-800 dark:text-red-200"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <strong className="font-bold">{t("errorTitle")}</strong>
          <span>{t("errorDesc")}</span>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4 w-full">
      {!limit && (
        // Mobile Optimization: Horizontal scroll container for filters
        // -mx-4 px-4 allows scrolling edge-to-edge on mobile while respecting container padding
        <div className="relative">
          <div className="flex overflow-x-auto pb-2 gap-2 scrollbar-hide -mx-1 px-1 snap-x">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setFilter("all")}
              className={`flex-shrink-0 px-5 py-2.5 rounded-xl text-sm font-medium transition-all snap-start border ${
                filter === "all"
                  ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25 border-blue-500"
                  : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              {t("all")} ({achievements.length})
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setFilter("unlocked")}
              className={`flex-shrink-0 px-5 py-2.5 rounded-xl text-sm font-medium transition-all snap-start border ${
                filter === "unlocked"
                  ? "bg-green-500 text-white shadow-lg shadow-green-500/25 border-green-500"
                  : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              {t("unlocked")} ({achievements.filter((a) => a.unlocked).length})
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setFilter("locked")}
              className={`flex-shrink-0 px-5 py-2.5 rounded-xl text-sm font-medium transition-all snap-start border ${
                filter === "locked"
                  ? "bg-amber-500 text-white shadow-lg shadow-amber-500/25 border-amber-500"
                  : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              {t("locked")} ({achievements.filter((a) => !a.unlocked).length})
            </motion.button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {loading && displayedAchievements.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12 px-4 rounded-2xl bg-gray-50 dark:bg-gray-800/30 border border-dashed border-gray-300 dark:border-gray-700"
        >
          <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-full mb-4">
                <svg
                  className="w-8 h-8 text-gray-400 dark:text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  ></path>
                </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
              {filter === "all"
                ? t("emptyAllTitle")
                : filter === "unlocked"
                ? t("emptyUnlockedTitle")
                : t("emptyLockedTitle")}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {filter === "all"
                ? t("emptyAllDesc")
                : filter === "unlocked"
                ? t("emptyUnlockedDesc")
                : t("emptyLockedDesc")}
            </p>
          </div>
        </motion.div>
      ) : (
        <motion.div
          layout // Smooth layout transition when filtering
          className={gridClassName}
        >
          {displayedAchievements.map((achievement, index) => (
            <motion.div
              layout
              key={achievement.achievementId}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              {...(limit && {
                onClick: () => router.push("/hub/student/my-achievements"),
                className: "cursor-pointer active:scale-95 transition-transform", // Better touch feedback
              })}
            >
              <AchievementCard studentAchievement={achievement} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default AchievementList;