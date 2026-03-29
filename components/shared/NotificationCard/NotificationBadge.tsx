"use client";

import * as React from "react";
import { twMerge } from "tailwind-merge";
import { motion } from "framer-motion";

interface NotificationBadgeProps {
  count: number;
  className?: string;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count,
  className,
}) => {
  if (count === 0) return null;

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0 }}
      className={twMerge(
        "absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full min-w-[17px] h-[17px] flex items-center justify-center font-medium border-2 border-container",
        className,
      )}
    >
      <motion.span
        key={count}
        initial={{ scale: 1.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        {count > 99 ? "99+" : count}
      </motion.span>
    </motion.div>
  );
};
