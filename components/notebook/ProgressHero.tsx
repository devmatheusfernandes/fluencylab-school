"use client";

import { useTranslations } from "next-intl";
import { Ghost, Rocket, Clock, Flame, Zap, Coffee } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ProgressHeroProps {
  currentDay: number;
  daysSinceClass: number;
  className?: string;
  hasActiveLesson?: boolean;
}

export function ProgressHero({ currentDay, daysSinceClass, className, hasActiveLesson = true }: ProgressHeroProps) {
  const t = useTranslations("ProgressHero");
  
  // Logic: If currentDay is significantly behind daysSinceClass
  // E.g., if daysSinceClass is 10 and currentDay is 5, they are late.
  // We can add a small buffer (e.g. 1-2 days grace period) if desired, 
  // but strict logic matches the user's request.
  const isDelayed = currentDay < daysSinceClass;

  // Determine styles based on state
  let bgClass = "bg-gradient-to-br from-indigo-600 to-violet-600 shadow-indigo-500/20";
  if (!hasActiveLesson) {
    bgClass = "bg-gradient-to-br from-emerald-400 to-teal-500 shadow-emerald-500/20";
  } else if (isDelayed) {
    bgClass = "bg-gradient-to-br from-rose-500 to-orange-600 shadow-rose-500/20";
  }

  return (
    <div 
      className={cn(
        "relative overflow-hidden rounded-3xl p-4 sm:p-6 md:p-8 shadow-lg transition-all duration-500 ease-in-out w-full h-full flex flex-col items-center justify-center text-center text-white",
        bgClass,
        className
      )}
    >
      {/* Background Pattern */}
      <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>
      
      {/* Dynamic Icon with Animation */}
      <div className="relative z-10 mb-2 md:mb-4">
        {!hasActiveLesson ? (
           <motion.div
             initial={{ scale: 0.8, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             transition={{ type: "spring", stiffness: 200, damping: 10 }}
           >
              <div className="bg-white/20 p-3 md:p-4 rounded-full backdrop-blur-sm">
                 <Coffee className="text-white w-10 h-10 md:w-14 md:h-14" />
              </div>
           </motion.div>
        ) : isDelayed ? (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 10 }}
          >
             <div className="bg-white/20 p-3 md:p-4 rounded-full backdrop-blur-sm">
                <Clock className="text-white animate-pulse w-10 h-10 md:w-14 md:h-14" />
             </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ y: 7, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 10 }}
          >
             <div className="relative">
                {/* Glow effect behind the ghost */}
                <div className="absolute inset-0 bg-white/20 blur-xl rounded-full transform scale-150"></div>
                <Ghost className="text-white relative z-10 animate-bounce w-10 h-10 md:w-14 md:h-14" />
             </div>
          </motion.div>
        )}
      </div>

      {/* Text Content */}
      <div className="relative z-10 max-w-md">
        <motion.h3 
            key={!hasActiveLesson ? "free-title" : isDelayed ? "delayed-title" : "ontrack-title"}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-md md:text-3xl font-bold mb-2 tracking-tight"
        >
          {!hasActiveLesson ? t("freeWeekTitle") : isDelayed ? t("delayedTitle") : t("onTrackTitle")}
        </motion.h3>
        
        <motion.p 
            key={!hasActiveLesson ? "free-desc" : isDelayed ? "delayed-desc" : "ontrack-desc"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-indigo-100 text-sm md:text-md leading-relaxed"
        >
          {!hasActiveLesson 
            ? t("freeWeekMessage")
            : isDelayed 
              ? t("delayedMessage", { currentDay, daysSinceClass }) 
              : t("onTrackMessage", { currentDay })
          }
        </motion.p>
      </div>

      {/* Optional Badge/Status Pill */}
      <div className="relative z-10 mt-2">
         <div className={cn(
             "px-3 py-1 md:px-4 md:py-1.5 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider bg-black/20 backdrop-blur-md border border-white/10",
             !hasActiveLesson ? "text-emerald-100" : isDelayed ? "text-rose-100" : "text-indigo-100"
         )}>
             {!hasActiveLesson ? t("statusFree") : isDelayed ? t("statusDelayed") : t("statusOnTrack")}
         </div>
      </div>

    </div>
  );
}
