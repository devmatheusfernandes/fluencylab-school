"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import AchievementCard from "./AchievementCard";
import { useAchievements } from "@/hooks/useAchievements";
import { useRouter } from "next/navigation";
import { Skeleton } from "../ui/skeleton";

interface AchievementListProps {
  userId: string | undefined;
  limit?: number; // New prop to control how many achievements to show
}

const AchievementList: React.FC<AchievementListProps> = ({ userId, limit }) => {
  const { achievements, loading, error } = useAchievements(userId);
  const [filter, setFilter] = useState<"all" | "unlocked" | "locked">("all");
  const router = useRouter();

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

  if (loading) {
    return (
      <div className="">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: limit || 6 }).map((_, index) => (
            <div key={index} className="skeleton-base rounded-2xl p-5">
              <div className="flex items-start gap-4">
                <Skeleton
                  className="skeleton-sub w-14 h-14 rounded-lg"
                />
                <div className="flex-1 min-w-0 space-y-2">
                  <Skeleton
                    className="skeleton-sub h-5 w-3/4"
                  />
                  <Skeleton
                    className="skeleton-sub h-4 w-full"
                  />
                  <Skeleton
                    className="skeleton-sub h-3 w-1/2"
                  />
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
        className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-xl shadow-lg dark:bg-red-900/30 dark:border-red-800 dark:text-red-200"
      >
        <div className="flex justify-between items-center">
          <div>
            <strong className="font-bold">Erro!</strong>
            <span className="block sm:inline">
              {" "}
              Não foi possível carregar suas conquistas.
            </span>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-3">
      {!limit && (
        <div className="flex flex-wrap gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === "all"
                ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            }`}
          >
            Todas ({achievements.length})
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setFilter("unlocked")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === "unlocked"
                ? "bg-green-500 text-white shadow-lg shadow-green-500/20"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            }`}
          >
            Desbloqueadas ({achievements.filter((a) => a.unlocked).length})
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setFilter("locked")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === "locked"
                ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            }`}
          >
            Bloqueadas ({achievements.filter((a) => !a.unlocked).length})
          </motion.button>
        </div>
      )}

      {loading && displayedAchievements.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-10 rounded-2xl bg-card/40 dark:bg-gray-800/50 border border-gray-400 dark:border-gray-700"
        >
          <div className="flex flex-col items-center justify-center">
            <svg
              className="w-16 h-16 text-gray-400 dark:text-gray-500 mb-4"
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
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-1">
              {filter === "all"
                ? "Nenhuma conquista disponível"
                : filter === "unlocked"
                  ? "Nenhuma conquista desbloqueada"
                  : "Nenhuma conquista bloqueada"}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {filter === "all"
                ? "Parece que ainda não há conquistas disponíveis"
                : filter === "unlocked"
                  ? "Você ainda não desbloqueou conquistas"
                  : "Não há conquistas bloqueadas"}
            </p>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
        >
          {displayedAchievements.map((achievement, index) => (
            <motion.div
              key={achievement.achievementId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              // Only make clickable if limit is applied (preview mode)
              {...(limit && {
                onClick: () => router.push("/hub/plataforma/achievements"),
                className: "cursor-pointer",
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
