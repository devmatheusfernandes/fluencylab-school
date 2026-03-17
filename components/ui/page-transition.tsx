"use client";

import { motion, Transition } from "framer-motion";
import { cn } from "@/lib/utils";

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
  effect?: "premium" | "spring" | "swipe" | "classic";
}

const animationVariants = {
  premium: {
    initial: { opacity: 0, scale: 0.98, filter: "blur(10px)" },
    animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
    exit: { opacity: 0, scale: 0.98, filter: "blur(10px)" },
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  },
  spring: {
    initial: { opacity: 0, y: 40, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: 40, scale: 0.95 },
    transition: { type: "spring", bounce: 0.3, duration: 0.7 } as Transition,
  },
  swipe: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
    transition: { duration: 0.4, ease: "easeInOut" } as Transition,
  },
  classic: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
    transition: { ease: "easeInOut", duration: 0.4 } as Transition,
  },
};

export function PageTransition({
  children,
  className,
  effect = "premium",
}: PageTransitionProps) {
  const currentEffect = animationVariants[effect];

  return (
    <motion.div
      initial={currentEffect.initial}
      animate={currentEffect.animate}
      exit={currentEffect.exit}
      transition={currentEffect.transition}
      className={cn("w-full h-full", className)}
    >
      {children}
    </motion.div>
  );
}
