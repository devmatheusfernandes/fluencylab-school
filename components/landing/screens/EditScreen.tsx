"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import {
  Bell,
  Users,
  Type,
  Bold,
  Italic,
  List,
  MessageSquare,
  ChevronLeft,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export function EditorScreen() {
  const t = useTranslations("LandingPage");
  const { data: session } = useSession();
  const [greeting, setGreeting] = useState<string>("");

  useEffect(() => {
    const updateGreeting = () => {
      const now = new Date();
      const hours = now.getHours();
      if (hours >= 5 && hours < 12) setGreeting("morning");
      else if (hours >= 12 && hours < 18) setGreeting("afternoon");
      else setGreeting("night");
    };
    updateGreeting();
  }, []);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-950">
      {/* Header Padronizado */}
      <header className="sticky top-0 z-20 bg-white/95 dark:bg-gray-950/95 backdrop-blur-md pt-12 pb-4 px-6 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <button className="p-1 -ml-1 text-gray-400">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <Avatar className="h-8 w-8 border border-gray-200 dark:border-gray-800">
              <AvatarImage src={session?.user?.image || undefined} />
              <AvatarFallback className="text-[10px]">
                {session?.user?.name?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">
                Collaborative Writing
              </p>
              <h3 className="text-sm font-black text-gray-900 dark:text-white">
                Unit 3: Essay Workshop
              </h3>
            </div>
          </div>
          <div className="flex -space-x-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-7 h-7 rounded-full border-2 border-white dark:border-gray-950 bg-gray-200 overflow-hidden"
              >
                <img
                  src={`https://i.pravatar.cc/100?u=${i}`}
                  alt="Collaborator"
                />
              </div>
            ))}
            <div className="w-7 h-7 rounded-full border-2 border-white dark:border-gray-950 bg-indigo-500 flex items-center justify-center text-[8px] text-white font-bold">
              +2
            </div>
          </div>
        </div>

        {/* Toolbar de Formatação */}
        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900/50 p-1.5 rounded-xl border border-gray-100 dark:border-gray-800 overflow-x-auto scrollbar-hide">
          <button className="p-2 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
            <Bold className="w-4 h-4" />
          </button>
          <button className="p-2 text-gray-500">
            <Italic className="w-4 h-4" />
          </button>
          <div className="w-[1px] h-4 bg-gray-300 dark:bg-gray-700 mx-1" />
          <button className="p-2 text-gray-500">
            <List className="w-4 h-4" />
          </button>
          <button className="p-2 text-gray-500">
            <MessageSquare className="w-4 h-4" />
          </button>
          <button className="ml-auto px-3 py-1 bg-indigo-600 text-white text-[10px] font-bold rounded-lg">
            SHARE
          </button>
        </div>
      </header>

      {/* Área do Documento */}
      <main className="flex-1 overflow-y-auto p-6 font-serif">
        <div className="max-w-prose mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            The Importance of Water
          </h1>

          <div className="relative text-gray-800 dark:text-gray-300 leading-relaxed text-sm space-y-4">
            <p>
              Water is essential for all known forms of life. Even though it
              provides no food energy or organic micronutrients, it is vital for
              <span className="relative bg-yellow-200 dark:bg-yellow-900/50 px-0.5 rounded-sm">
                the human body
                {/* Cursor do Professor */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute -top-5 left-0 bg-blue-500 text-[8px] text-white px-1 rounded flex items-center gap-1"
                >
                  <span className="font-bold">Teacher Sarah</span>
                  <div className="absolute top-full left-1 w-0.5 h-4 bg-blue-500" />
                </motion.div>
              </span>{" "}
              to function properly.
            </p>

            <p className="relative">
              In our last lesson, we discussed how molecules react.
              <span className="inline-block w-0.5 h-4 bg-indigo-500 animate-pulse translate-y-1" />
              <span className="text-gray-400"> (Continue writing here...)</span>
            </p>

            {/* Balão de Comentário Lateral */}
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="mt-8 p-3 bg-indigo-50 dark:bg-indigo-950/40 border-l-4 border-indigo-500 rounded-r-xl"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold text-indigo-600 uppercase">
                  Suggestion from Professor
                </span>
              </div>
              <p className="text-xs italic text-gray-600 dark:text-gray-400">
                "Try using more descriptive adjectives when talking about
                hydration."
              </p>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Footer com Status de Salvamento */}
      <footer className="p-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-[10px] text-gray-500 font-medium tracking-wide">
            AUTOSAVED
          </span>
        </div>
        <div className="flex items-center gap-2 text-gray-400">
          <Users className="w-3.5 h-3.5" />
          <span className="text-[10px] font-bold uppercase">5 Online</span>
        </div>
      </footer>
    </div>
  );
}
