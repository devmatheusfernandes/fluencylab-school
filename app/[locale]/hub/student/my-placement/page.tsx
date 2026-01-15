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

export default function PlacementHomePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
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
    <div className="flex flex-col md:items-center py-6 px-4 font-sans text-slate-800">
      <div className="w-full max-w-2xl flex-1 flex flex-col justify-center">
        <motion.div
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="space-y-8"
        >
          <div className="text-center space-y-4">
            <div className="inline-block p-4 bg-background rounded-2xl mb-2">
              <Globe className="h-12 w-12 text-primary" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              Choose a language
            </h1>
            <p className="text-slate-500 font-medium text-lg">
              We'll adapt the test to your level.
            </p>
          </div>

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
                    Continue your {incompleteTest.lang === "en" ? "English" : "Portuguese"} Test
                  </h3>
                  <p className="text-sm text-slate-500 font-medium">
                    You have a test in progress.
                  </p>
                </div>
              </div>
              <Button
                onClick={handleContinue}
                className="w-full sm:w-auto font-bold uppercase tracking-wider"
              >
                Continue
              </Button>
            </motion.div>
          )}

          {!incompleteTest && (
            <>
              {/* Language Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    id: "en",
                    label: "English",
                    flag: "🇺🇸",
                    color: "bg-emerald-500",
                  },
                  {
                    id: "pt",
                    label: "Portuguese",
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
                    <span className="text-4xl shadow-sm rounded-full bg-white p-2">
                      {lang.flag}
                    </span>
                    <div>
                      <span className="block font-bold text-xl text-slate-700">
                        {lang.label}
                      </span>
                      {selectedLanguage === lang.id && (
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Selected
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

              <div className="bg-card rounded-xl border-2 border-accent p-4 flex gap-3 text-blue-800">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <div className="text-sm font-medium leading-relaxed">
                  The test takes about 10 minutes. Questions get harder or
                  easier based on your answers. Good luck!
                </div>
              </div>

              <Button
                size="lg"
                className="w-full h-14 text-lg font-bold uppercase tracking-wider rounded-2xl border-b-4 border-primary-foreground/20 active:border-b-0 active:translate-y-1 transition-all"
                onClick={handleStart}
              >
                Start Placement Test
              </Button>
            </>
          )}

          <div className="pt-6">
            <Button
              variant="ghost"
              className="w-full font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 justify-center"
              onClick={handleViewHistory}
            >
              <History className="h-4 w-4" /> View Past Results
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
