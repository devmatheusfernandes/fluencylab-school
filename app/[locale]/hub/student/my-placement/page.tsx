"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  AlertCircle,
  History,
  Globe,
  PlayCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { pageVariants } from "../../../../../config/animations";
import { Header } from "@/components/ui/header";
import { useTranslations } from "next-intl";

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

  return (
    <div className="flex flex-col py-6 px-4 w-full">
      <div className=" flex flex-col justify-center">
        <motion.div
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="space-y-8"
        >
          <Header
            heading={t("chooseLanguage")}
            subheading={t("adaptTestLevel")}
            backHref="/hub/student/my-profile"
            icon={<Globe className="h-12 w-12 text-primary" />}
            className="mb-8"
          />

          {incompleteTest && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-primary/10 border-2 border-primary/20 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <PlayCircle className="h-10 w-10 text-primary" />
                <div>
                  <h3 className="font-bold text-lg text-primary-foreground">
                    {t("continueTest", { lang: incompleteTest.lang === "en" ? tLang("english") : tLang("portuguese") })}
                  </h3>
                  <p className="text-sm text-slate-500 font-medium">
                    {t("testInProgress")}
                  </p>
                </div>
              </div>
              <Button
                onClick={handleContinue}
                className="w-full sm:w-auto font-bold uppercase tracking-wider"
              >
                {t("continue")}
              </Button>
            </motion.div>
          )}

          {!incompleteTest && (
            <>
              {/* Language Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-3xl mx-auto py-4">
                {[
                  {
                    id: "en",
                    label: tLang("english"),
                    flag: "🇺🇸",
                    color: "bg-emerald-500",
                  },
                  {
                    id: "pt",
                    label: tLang("portuguese"),
                    flag: "🇧🇷",
                    color: "bg-amber-500",
                  },
                ].map((lang) => (
                  <motion.button
                    key={lang.id}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98, y: 0 }}
                    onClick={() =>
                      setSelectedLanguage(lang.id as "en" | "pt")
                    }
                    className={`relative p-6 rounded-2xl border-2 border-b-4 transition-all text-left flex items-center gap-4 ${
                      selectedLanguage === lang.id
                        ? `border-${lang.id === "en" ? "amber" : "purple"}-500 bg-${
                            lang.id === "en" ? "amber" : "purple"
                          }-50`
                        : "bg-card border-2 border-accent"
                    }`}
                  >
                    <div>
                      <span className={`block font-bold text-xl ${selectedLanguage === lang.id ? "text-black" : "text-white"}`}>
                        {lang.label}
                      </span>
                      {selectedLanguage === lang.id && (
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          {t("selected")}
                        </span>
                      )}
                    </div>
                    {selectedLanguage === lang.id && (
                      <div className="absolute top-4 right-4">
                        <CheckCircle2
                          className={`h-6 w-6 text-${
                            lang.id === "en" ? "amber" : "purple"
                          }-500`}
                        />
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>

              <div className="bg-card w-full max-w-3xl mx-auto rounded-xl border-2 border-accent p-4 flex gap-3 text-blue-800">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <div className="text-sm font-medium leading-relaxed">
                  {t("testDuration")}
                </div>
              </div>

              <Button
                size="lg"
                className="w-full max-w-3xl mx-auto flex justify-center h-14 text-lg font-bold uppercase tracking-wider rounded-2xl border-b-4 border-primary-foreground/20 active:border-b-0 active:translate-y-1 transition-all"
                onClick={handleStart}
              >
                {t("startTest")}
              </Button>
            </>
          )}

          <div className="pt-6">
            <Button
              variant="ghost"
              className="mx-auto font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 justify-center"
              onClick={handleViewHistory}
            >
              <History className="h-4 w-4 mr-2" /> {t("viewHistory")}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
