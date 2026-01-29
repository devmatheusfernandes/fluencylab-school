"use client";

import React from "react";
import { motion } from "framer-motion";
import { StudentAchievement } from "@/types/users/achievements";
import { format } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { getAchievementDefinition } from "@/config/achievementDefinitions";
import { useTranslations, useLocale } from "next-intl";

interface AchievementCardProps {
  studentAchievement: StudentAchievement;
}

const AchievementCard: React.FC<AchievementCardProps> = ({
  studentAchievement,
}) => {
  const t = useTranslations("Achievements");
  const tAchievementCard = useTranslations("AchievementCard");
  const locale = useLocale();
  const dateLocale = locale === "pt" ? ptBR : enUS;
  
  const definition = getAchievementDefinition(studentAchievement.achievementId);

  if (!definition) {
    console.warn(
      `Achievement definition not found for ID: ${studentAchievement.achievementId}`
    );
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="border rounded-lg p-4 bg-gray-50 border-gray-200 dark:bg-gray-900 dark:border-gray-800"
      >
        <div className="text-center text-gray-500 dark:text-gray-400 text-sm">
          <p>{t("notFound", { id: studentAchievement.achievementId })}</p>
        </div>
      </motion.div>
    );
  }

  const isUnlocked = studentAchievement.unlocked;
  const unlockedDate = studentAchievement.unlockedAt
    ? format(new Date(studentAchievement.unlockedAt), "dd MMM, yyyy", {
        locale: dateLocale,
      })
    : null;

  // Mapeamento de labels de idioma
  const languageKeyMap: Record<string, string> = {
        english: "english",
        spanish: "spanish",
        libras: "libras",
        portuguese: "portuguese",
        Ingles: "english",
        Espanhol: "spanish",
        Libras: "libras",
        Portugues: "portuguese",
  };
  
  const normalizedLang = studentAchievement.language ? languageKeyMap[studentAchievement.language] : undefined;
  const languageLabel = normalizedLang 
    ? tAchievementCard(`languages.${normalizedLang}`) 
    : studentAchievement.language || "";

  const cardVariants = {
    hidden: { opacity: 0, y: 10, scale: 0.98 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.3, ease: "easeOut" as const },
    },
    hover: {
      y: -2,
      shadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
      transition: { duration: 0.2 },
    },
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      // MUDANÇA PRINCIPAL: Remoção de gradientes de fundo.
      // Uso de cores sólidas (bg-white/bg-gray-50) e bordas para diferenciação.
      className={`
        relative border rounded-xl p-3 transition-all duration-200 overflow-hidden group h-full flex flex-col card-base
        ${
          isUnlocked
            ? "bg-emerald-100/40 border-green-500/30 dark:border-green-500/20 shadow-sm"
            : "bg-white/60 dark:bg-gray-900 border-gray-200 dark:border-gray-800"
        }
      `}
    >
      <div className="flex gap-2 flex-1">
        {/* Ícone: Cores planas em vez de depender do fundo do card */}
        <div
          className={`
          w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 transition-colors
          ${
            isUnlocked
              ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
              : "bg-gray-200 text-gray-400 dark:bg-gray-800 dark:text-gray-600"
          }
        `}
        >
          {definition.icon}
        </div>

        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3
              className={`
              font-semibold text-base truncate mr-auto
              ${
                isUnlocked
                  ? "text-gray-900 dark:text-white"
                  : "text-gray-600 dark:text-gray-400"
              }
            `}
            >
              {t(`${definition.id}.title`)}
            </h3>

            {languageLabel && (
              // Labels mais discretas
              <span className="text-xs px-2 py-0.5 rounded-md font-medium bg-gray-100 text-gray-600 dark:bg-gray-700/50 dark:text-gray-300">
                {languageLabel}
              </span>
            )}
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 font-normal leading-relaxed">
            {t(`${definition.id}.description`)}
          </p>

          {/* Footer com Data ou Status */}
          <div className="mt-auto pt-2 flex items-center text-xs font-medium">
            {isUnlocked ? (
              <p className="text-green-600 dark:text-green-400 flex items-center gap-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-3.5 h-3.5"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                    clipRule="evenodd"
                  />
                </svg>
                {tAchievementCard("unlockedAt", { date: unlockedDate ?? "" })}
              </p>
            ) : (
              <p className="text-gray-400 dark:text-gray-500 flex items-center gap-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-3.5 h-3.5"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z"
                    clipRule="evenodd"
                  />
                </svg>
                {tAchievementCard("locked")}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Barra de Progresso Minimalista */}
      {studentAchievement.progress !== undefined &&
        studentAchievement.progressMax !== undefined &&
        !isUnlocked && ( // Opcional: mostrar progresso apenas se não estiver desbloqueado para limpar ainda mais
          <div className="mt-4 space-y-1.5">
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 font-medium">
              <span>{tAchievementCard("progress")}</span>
              <span>
                {studentAchievement.progress}/{studentAchievement.progressMax}
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5 dark:bg-gray-800 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${
                    (studentAchievement.progress /
                      studentAchievement.progressMax) *
                    100
                  }%`,
                }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                // MUDANÇA: Barra de cor sólida (azul plano) em vez de gradiente
                className="h-full rounded-full bg-primary"
              />
            </div>
          </div>
        )}
    </motion.div>
  );
};

export default AchievementCard;
