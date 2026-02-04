"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SubmitButtonProps {
  children: React.ReactNode;
  onClick: () => Promise<void>; // Função assíncrona para simular login
  className?: string;
  onAnimationComplete?: () => void; // Para redirecionar após a expansão
}

export default function SubmitButton({
  children,
  onClick,
  className = "",
  onAnimationComplete,
}: SubmitButtonProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  const [ripple, setRipple] = useState<{ x: number; y: number } | null>(null);

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (status !== "idle") return;

    // 1. Efeito Ripple
    const rect = e.currentTarget.getBoundingClientRect();
    setRipple({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });

    // 2. Iniciar Loading
    setStatus("loading");

    // 3. Executar a ação (ex: login)
    try {
      await onClick();
      // 4. Se der certo, iniciar animação de sucesso
      setStatus("success");
    } catch (error) {
      console.error(error);
      setStatus("idle"); // Reseta se der erro
      setRipple(null);
    }
  };

  return (
    <div className={`relative w-full flex justify-center ${className}`}>
      <motion.button
        layout
        onClick={handleClick}
        className={`relative overflow-hidden rounded-full bg-[#FF3366] text-white font-semibold shadow-lg outline-none
          ${status === "success" ? "z-50" : "z-10"} 
        `}
        // Variantes para controlar a largura e escala do botão
        initial={false}
        animate={
          status === "loading"
            ? { width: "4rem", height: "4rem", borderRadius: "50%" }
            : status === "success"
              ? {
                  width: "4rem",
                  height: "4rem",
                  scale: 30, // A expansão massiva que cobre a tela
                  transition: { duration: 0.4, ease: "easeIn" },
                }
              : { width: "100%", height: "4rem", borderRadius: "30px" }
        }
        onAnimationComplete={(definition) => {
          // Quando a animação de sucesso termina, chama o callback (ex: router.push)
          if (status === "success" && (definition as any).scale === 30) {
            onAnimationComplete && onAnimationComplete();
          }
        }}
      >
        <AnimatePresence mode="wait">
          {/* ESTADO 1: Texto Normal (Sign in) */}
          {status === "idle" && (
            <motion.span
              key="text"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              {children}
              {/* Ripple Efeito */}
              {ripple && (
                <motion.span
                  initial={{ scale: 0, opacity: 0.5 }}
                  animate={{ scale: 2, opacity: 0 }}
                  className="absolute bg-white rounded-full w-[100px] h-[100px] pointer-events-none"
                  style={{ top: ripple.y - 50, left: ripple.x - 50 }}
                />
              )}
            </motion.span>
          )}

          {/* ESTADO 2: Spinner de Loading */}
          {status === "loading" && (
            <motion.div
              key="spinner"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <svg
                className="animate-spin h-6 w-6 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                ></path>
              </svg>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
