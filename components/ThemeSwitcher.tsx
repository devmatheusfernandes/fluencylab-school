"use client";

import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useIsStandalone } from "@/hooks/ui/useIsStandalone";

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const t = useTranslations("Theme");
  const isStandalone = useIsStandalone();

  useEffect(() => {
    // Usando setTimeout para evitar atualização síncrona dentro do efeito
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const themes = [
    { value: "light", label: t("light"), icon: Sun, color: "text-amber-500" },
    { value: "dark", label: t("dark"), icon: Moon, color: "text-violet-400" },
    {
      value: "system",
      label: t("system"),
      icon: Monitor,
      color: "text-blue-500",
    },
  ];

  const currentTheme = themes.find((t) => t.value === theme) || themes[0];
  const CurrentIcon = currentTheme.icon;
  const handleToggle = () => {
    if (isStandalone) {
      const currentIndex = themes.findIndex((t) => t.value === theme);
      const nextIndex = (currentIndex + 1) % themes.length;
      setTheme(themes[nextIndex].value);
    } else {
      setIsOpen(!isOpen);
    }
  };

  if (!mounted) {
    return (
      <div className="relative">
        <div className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200/50 dark:border-slate-700/50 bg-white/20 dark:bg-slate-900/35 transition-colors duration-200" />
      </div>
    );
  }

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleToggle}
        aria-label={t("toggle")}
        className="relative flex h-10 w-10 items-center justify-center rounded-lg border-none border-slate-200/50 dark:border-slate-700/50 bg-white/20 dark:bg-slate-900/35 hover:bg-white/40 dark:hover:bg-slate-800/50 transition-colors duration-200"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={theme}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <CurrentIcon className={`h-5 w-5 ${currentTheme.color}`} />
          </motion.div>
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {isOpen && !isStandalone && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="absolute right-0 top-12 z-50 w-48 rounded-lg border border-slate-200/50 dark:border-slate-700/50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg shadow-xl overflow-hidden"
            >
              <div className="p-1">
                {themes.map((themeOption, index) => {
                  const Icon = themeOption.icon;
                  const isActive = theme === themeOption.value;

                  return (
                    <motion.button
                      key={themeOption.value}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ x: 4 }}
                      onClick={() => {
                        setTheme(themeOption.value);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-colors duration-150 ${
                        isActive
                          ? "bg-primary/10 text-primary font-medium"
                          : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 ${
                          isActive ? themeOption.color : "text-current"
                        }`}
                      />
                      <span className="flex-1">{themeOption.label}</span>
                      {isActive && (
                        <motion.div
                          layoutId="active-indicator"
                          className="h-2 w-2 rounded-full bg-primary"
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 25,
                          }}
                        />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
