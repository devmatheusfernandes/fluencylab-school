"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  History,
  Globe,
  Play,
  Clock,
  Zap,
  BarChart3,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Header } from "@/components/ui/header";
import { useTranslations } from "next-intl";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Utilitário para classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Configuração dos Idiomas
const LANGUAGES = [
  {
    id: "en",
    labelKey: "english",
    flag: "🇺🇸",
    color: "blue",
    bgSelected: "bg-blue-50 dark:bg-blue-900/20",
    borderSelected: "border-blue-500",
    textSelected: "text-blue-700 dark:text-blue-300",
  },
  {
    id: "pt",
    labelKey: "portuguese",
    flag: "🇧🇷",
    color: "emerald",
    bgSelected: "bg-emerald-50 dark:bg-emerald-900/20",
    borderSelected: "border-emerald-500",
    textSelected: "text-emerald-700 dark:text-emerald-300",
  },
] as const;

export default function PlacementHomePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("Placement");
  const tLang = useTranslations("Languages");
  
  const [selectedLanguage, setSelectedLanguage] = useState<"en" | "pt">("en");
  const [incompleteTest, setIncompleteTest] = useState<{
    lang: "en" | "pt";
    progress: number;
  } | null>(null);

  useEffect(() => {
    const checkProgress = async () => {
      if (!session?.user?.id) return;
      try {
        const docRef = doc(db, "placement_progress", session.user.id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (!data.completed && data.selectedLanguage) {
            setIncompleteTest({
              lang: data.selectedLanguage,
              progress: data.adaptiveState?.questionCount || 0,
            });
          }
        }
      } catch (error) {
        console.error("Error checking progress:", error);
      }
    };
    checkProgress();
  }, [session?.user?.id]);

  const handleStart = () => {
    router.push(`${pathname}/test?lang=${selectedLanguage}`);
  };

  const handleContinue = () => {
    if (incompleteTest) {
      router.push(`${pathname}/test?lang=${incompleteTest.lang}`);
    }
  };

  const handleViewHistory = () => {
    router.push(`${pathname}/history`);
  };

  // Animação container
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" as const, staggerChildren: 0.1 }
    },
    exit: { opacity: 0, y: -20 }
  };

  return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="p-4 md:p-6 space-y-6"
      >
        {/* Header Section */}
        <Header 
          heading={t("chooseLanguage")}
          subheading={t("adaptTestLevel")}
          icon={
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-primary/5 dark:bg-primary/10">
              <Globe className="h-8 w-8 text-primary" />
            </div>
          }
        />

        {/* Dynamic Content Area */}
        <AnimatePresence mode="wait">
          {incompleteTest ? (
            /* RESUME CARD */
            <motion.div
              key="resume-card"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mt-8 bg-zinc-300 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 md:p-8 shadow-xl shadow-zinc-200/40 dark:shadow-none max-w-2xl mx-auto relative overflow-hidden group"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
              
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="flex-1 text-center md:text-left space-y-1">
                  <h3 className="font-bold text-xl text-zinc-900 dark:text-zinc-100">
                    {t("continueTest", { 
                      lang: incompleteTest.lang === "en" ? tLang("english") : tLang("portuguese") 
                    })}
                  </h3>
                  <p className="text-zinc-500 dark:text-zinc-400">
                    {t("testInProgress")}
                  </p>
                  
                  {/* Visual Progress Bar Mockup */}
                  <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full mt-3 overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full" 
                      style={{ width: `${Math.min((incompleteTest.progress / 30) * 100, 90)}%` }} 
                    />
                  </div>
                  <p className="text-xs text-zinc-400 mt-1 text-right">
                     Questão {incompleteTest.progress + 1}
                  </p>
                </div>

                <Button 
                  onClick={handleContinue}
                  size="lg"
                  className="w-full md:w-auto min-w-[140px] font-semibold"
                >
                  {t("continue")}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          ) : (
            /* NEW TEST SELECTION */
            <motion.div 
              key="selection-area"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              {/* Language Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mx-auto">
                {LANGUAGES.map((lang) => {
                  const isSelected = selectedLanguage === lang.id;
                  
                  return (
                    <motion.div
                      key={lang.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedLanguage(lang.id as "en" | "pt")}
                      className={cn(
                        "relative cursor-pointer rounded-2xl border-2 p-6 transition-all duration-200 flex items-center gap-4",
                        "bg-white dark:bg-zinc-900 hover:shadow-md dark:hover:shadow-zinc-800/50",
                        isSelected 
                          ? cn(lang.borderSelected, lang.bgSelected) 
                          : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                      )}
                    >
                      {/* Flag/Icon Container */}
                      <div className="text-4xl shadow-sm rounded-lg overflow-hidden">
                        {lang.flag}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className={cn(
                            "text-lg font-bold", 
                            isSelected ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-600 dark:text-zinc-400"
                          )}>
                            {tLang(lang.labelKey)}
                          </span>
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className={cn("rounded-full p-1", lang.textSelected)}
                            >
                              <CheckCircle2 className="w-6 h-6 fill-current" />
                            </motion.div>
                          )}
                        </div>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                           {/* Texto fixo ou traduzido para descrição */}
                           {lang.id === 'en' ? 'General Proficiency' : 'Proficiência Geral'}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Info Features Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
                  <div className="flex flex-col items-center p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 text-center hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors duration-300">
                      <Clock className="w-6 h-6 text-blue-500 mb-2" />
                      <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{t("infoDurationTitle")}</span>
                      <span className="text-xs text-zinc-500">{t("infoDurationDesc")}</span>
                  </div>
                  <div className="flex flex-col items-center p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 text-center hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors duration-300">
                      <Zap className="w-6 h-6 text-amber-500 mb-2" />
                      <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{t("infoAdaptiveTitle")}</span>
                      <span className="text-xs text-zinc-500">{t("infoAdaptiveDesc")}</span>
                  </div>
                  <div className="flex flex-col items-center p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 text-center hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors duration-300">
                      <BarChart3 className="w-6 h-6 text-emerald-500 mb-2" />
                      <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{t("infoResultTitle")}</span>
                      <span className="text-xs text-zinc-500">{t("infoResultDesc")}</span>
                  </div>
              </div>

              {/* Action Button */}
              <div className="flex justify-center pt-2">
                <Button
                  size="lg"
                  onClick={handleStart}
                  className="w-full max-w-sm h-12 text-base font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
                >
                  {t("startTest")}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer Link */}
        <motion.div 
            variants={containerVariants}
            className="flex justify-center pt-8 border-t border-zinc-100 dark:border-zinc-800"
        >
          <Button
            variant="ghost"
            onClick={handleViewHistory}
            className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            <History className="w-4 h-4 mr-2" />
            {t("viewHistory")}
          </Button>
        </motion.div>
      </motion.div>
  );
}