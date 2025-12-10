"use client";

import React from "react";
import { motion } from "framer-motion";
import { StudentAchievement } from "@/types/users/achievements";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getAchievementDefinition } from "@/config/achievementDefinitions";

interface AchievementCardProps {
  studentAchievement: StudentAchievement;
}

const AchievementCard: React.FC<AchievementCardProps> = ({
  studentAchievement,
}) => {
  const definition = getAchievementDefinition(studentAchievement.achievementId);

  if (!definition) {
    console.warn(
      `Achievement definition not found for ID: ${studentAchievement.achievementId}`
    );
    // Even if definition is not found, we still want to show the card
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border rounded-2xl p-5 bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700"
      >
        <div className="text-center text-gray-500 dark:text-gray-400">
          <p>Conquista não encontrada</p>
          <p className="text-sm mt-1">ID: {studentAchievement.achievementId}</p>
        </div>
      </motion.div>
    );
  }

  const isUnlocked = studentAchievement.unlocked;
  const unlockedDate = studentAchievement.unlockedAt
    ? format(new Date(studentAchievement.unlockedAt), "dd/MM/yyyy 'às' HH:mm", {
        locale: ptBR,
      })
    : null;

  // Language label mapping
  const languageLabel = studentAchievement.language
    ? {
        english: "Inglês",
        spanish: "Espanhol",
        libras: "Libras",
        portuguese: "Português",
        Ingles: "Inglês",
        Espanhol: "Espanhol",
        Libras: "Libras",
        Portugues: "Português",
      }[studentAchievement.language] || studentAchievement.language
    : "";

  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" as const },
    },
    hover: {
      y: -5,
      scale: 1.02,
      transition: { duration: 0.2 },
    },
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      className={`
        border rounded-2xl p-5 transition-all duration-300
        ${
          isUnlocked
            ? "bg-gradient-to-br from-container to-teal-400 border-teal-200/70 dark:from-gray-800 dark:to-teal-900/20 dark:border-teal-800/30 shadow-sm hover:shadow-lg"
            : "bg-gradient-to-br from-container to-card border-gray-200/70 dark:from-gray-800 dark:to-gray-900 dark:border-gray-700 shadow-sm hover:shadow-md"
        }
        overflow-hidden relative
      
      `}
    >
      {/* Glow effect for unlocked achievements */}
      {isUnlocked && (
        <div className="absolute inset-0 bg-gradient-to-r from-green-100/10 to-transparent dark:from-green-500/5 pointer-events-none" />
      )}

      <div className="flex items-start gap-4">
        {/* Icon with animated shine */}
        <div className="relative">
          <div
            className={`
            w-14 h-14 rounded-lg flex items-center justify-center text-2xl
            ${
              isUnlocked
                ? "bg-background text-green-600 dark:bg-green-900/50 dark:text-green-400"
                : "bg-background text-gray-400 dark:bg-gray-700 dark:text-gray-500"
            }
          `}
          >
            {definition.icon}
          </div>

          {/* Shine effect when unlocked */}
          {isUnlocked && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.4, 0] }}
              transition={{ duration: 20, repeat: Infinity, delay: 20 }}
              className="absolute inset-0 bg-white/50 rounded-xl"
            />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3
              className={`
              font-bold text-lg truncate
              ${
                isUnlocked
                  ? "text-green-800 dark:text-green-200"
                  : "text-gray-700 dark:text-gray-300"
              }
            `}
            >
              {definition.name}
            </h3>

            {languageLabel && (
              <span
                className={`
                text-xs px-2 py-1 rounded-full font-medium
                ${
                  isUnlocked
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300"
                    : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                }
              `}
              >
                {languageLabel}
              </span>
            )}
          </div>

          <p
            className={`
            mt-1 text-sm
            ${
              isUnlocked
                ? "text-green-700 dark:text-green-300/90"
                : "text-gray-600 dark:text-gray-400"
            }
          `}
          >
            {definition.description}
          </p>

          {/* Unlock date or status */}
          <div className="mt-2">
            {isUnlocked && unlockedDate ? (
              <p className="text-xs text-green-600 dark:text-green-400/90">
                Desbloqueada em:{" "}
                <span className="font-medium">{unlockedDate}</span>
              </p>
            ) : (
              <p className="text-xs text-gray-500 dark:text-gray-500">
                🔒 Bloqueada - Complete os requisitos
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      {studentAchievement.progress !== undefined &&
        studentAchievement.progressMax !== undefined && (
          <div className="mt-4">
            <div className="flex justify-between text-xs mb-1">
              <span
                className={`
                ${
                  isUnlocked
                    ? "text-green-700 dark:text-green-400"
                    : "text-gray-600 dark:text-gray-400"
                }
              `}
              >
                Progresso: {studentAchievement.progress}/
                {studentAchievement.progressMax}
              </span>
              <span
                className={`
                font-medium
                ${
                  isUnlocked
                    ? "text-green-700 dark:text-green-400"
                    : "text-gray-600 dark:text-gray-400"
                }
              `}
              >
                {Math.round(
                  (studentAchievement.progress /
                    studentAchievement.progressMax) *
                    100
                )}
                %
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${(studentAchievement.progress / studentAchievement.progressMax) * 100}%`,
                }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={`
                  h-full rounded-full
                  ${
                    isUnlocked
                      ? "bg-green-500"
                      : "bg-gradient-to-r from-blue-400 to-blue-600"
                  }
                `}
              />
            </div>
          </div>
        )}
    </motion.div>
  );
};

export default AchievementCard;
