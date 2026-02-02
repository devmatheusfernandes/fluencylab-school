"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface PhoneMockupProps {
  children?: React.ReactNode;
}

export function PhoneMockup({ children }: PhoneMockupProps) {
  // Estados para horário
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Format time HH:MM
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const formattedTime = `${hours}:${minutes.toString().padStart(2, "0")}`;
      setCurrentTime(formattedTime);
    };

    updateTime();
    const interval = setInterval(updateTime, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 100, rotate: 10 }}
      animate={{ opacity: 1, y: 0, rotate: -6 }}
      whileHover={{ rotate: 0, scale: 1.02 }}
      transition={{
        type: "spring",
        stiffness: 100,
        damping: 20,
        mass: 1,
        delay: 0.2,
      }}
      className="relative z-10 w-[380px] md:w-[320px] lg:w-[500px] -translate-y-22 translate-x-5 lg:translate-y-0 lg:mt-0 cursor-pointer"
    >
      {/* MUDANÇA: Borda do telefone ajustada para combinar com o tema */}
      <div className="w-full h-full bg-white dark:bg-gray-900 rounded-[3rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] border-[6px] border-gray-100 dark:border-gray-800 ring-1 ring-gray-900/5 flex flex-col overflow-hidden relative">
        {/* Status Bar */}
        <div className="absolute top-0 w-full h-6 z-20 flex justify-between px-6 p-6 items-center mt-3">
          <div className="text-[10px] font-bold text-gray-800 dark:text-gray-200">
            {currentTime || "9:41"}
          </div>
          <div className="flex gap-1">
            <div className="w-4 h-2.5 bg-gray-800 dark:bg-gray-200 rounded-[2px]" />
          </div>
        </div>

        {/* Conteúdo da Tela com Scroll */}
        {/* MUDANÇA: Fundo interno do telefone */}
        <div className="flex-1 bg-gray-50 dark:bg-gray-950 pt-10 px-5 pb-6 flex flex-col gap-4 overflow-hidden">
          {children}
        </div>
      </div>
    </motion.div>
  );
}
