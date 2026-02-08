// components/ui/NoResults.tsx
"use client";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

interface NoResultsProps {
  searchQuery?: string;
  customMessage?: {
    withSearch?: string;
    withoutSearch?: string;
  };
  title?: string;
  description?: string;
  className?: string;
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring" as const,
      stiffness: 120,
      damping: 12,
    },
  },
};

const iconVariants = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring" as const,
      stiffness: 150,
      damping: 12,
      delay: 0.1,
    },
  },
};

export const NoResults: React.FC<NoResultsProps> = ({
  searchQuery = "",
  customMessage,
  title,
  description,
  className = "",
}) => {
  const t = useTranslations("NoResults");
  const defaultMessages = {
    withSearch: t("withSearch"),
    withoutSearch: t("withoutSearch"),
  };

  const messages = { ...defaultMessages, ...customMessage };
  const message =
    title || (searchQuery ? messages.withSearch : messages.withoutSearch);

  return (
    <motion.div
      className={`text-wrap text-center py-8 text-primary/85 dark:text-primary/70 ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div className="mx-auto w-24 h-24 mb-4" variants={iconVariants}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-full w-full text-primary/50"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </motion.div>

      <motion.p className="text-lg font-medium" variants={itemVariants}>
        {message}
      </motion.p>

      {description && (
        <motion.p
          className="mt-2 text-sm text-muted-foreground"
          variants={itemVariants}
        >
          {description}
        </motion.p>
      )}

      {searchQuery && !title && (
        <motion.p className="mt-2 text-sm" variants={itemVariants}>
          {t("adjustSearch")}
        </motion.p>
      )}
    </motion.div>
  );
};
