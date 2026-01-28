"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useContract } from "@/hooks/useContract";
import { Skeleton } from "../ui/skeleton";
import { useTranslations } from "next-intl";
import { doc, getDoc, collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { ChevronRight, CheckCircle2, AlertCircle, Clock, XCircle } from "lucide-react"; // Ícones sugeridos
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Utilitário para classes (pode colocar no seu lib/utils.ts)
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface StatusUIProps {
  text: string;
  variant: "success" | "pending" | "warning" | "neutral";
  link: string;
  icon?: React.ReactNode;
  subLabel?: string; // Adicionado para dar mais contexto (ex: "Clique para assinar")
}

// Configuração visual baseada no status
const STATUS_CONFIG = {
  success: {
    color: "text-teal-600 dark:text-teal-400",
    bg: "bg-teal-100/50 dark:bg-teal-900/20",
    border: "group-hover:border-teal-200 dark:group-hover:border-teal-800",
    icon: CheckCircle2,
  },
  pending: {
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-100/50 dark:bg-rose-900/20",
    border: "group-hover:border-rose-200 dark:group-hover:border-rose-800",
    icon: XCircle,
  },
  warning: {
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-100/50 dark:bg-amber-900/20",
    border: "group-hover:border-amber-200 dark:group-hover:border-amber-800",
    icon: AlertCircle,
  },
  neutral: {
    color: "text-slate-500 dark:text-slate-400",
    bg: "bg-slate-100/50 dark:bg-slate-800/50",
    border: "group-hover:border-slate-200 dark:group-hover:border-slate-700",
    icon: Clock,
  },
};

const StatusItem: React.FC<StatusUIProps> = ({ text, variant, link, icon: CustomIcon }) => {
  const config = STATUS_CONFIG[variant] || STATUS_CONFIG.neutral;
  const StatusIcon = config.icon;

  return (
    <Link href={link} className="block w-full outline-none group">
      <motion.div
        whileHover={{ scale: 1.005 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "relative flex items-center justify-between p-4 w-full rounded-xl transition-all duration-300",
          "card-base border border-zinc-200 dark:border-zinc-800",
          "hover:shadow-md dark:hover:shadow-zinc-900/50 hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50",
          config.border // Borda colorida suave no hover
        )}
      >
        <div className="flex items-center gap-4">
          {/* Icon Container */}
          <div className={cn("p-2.5 rounded-lg flex items-center justify-center transition-colors", config.bg, config.color)}>
            {CustomIcon ? (
              <span className="w-5 h-5">{CustomIcon}</span>
            ) : (
              <StatusIcon className="w-5 h-5" />
            )}
          </div>

          {/* Text Content */}
          <div className="flex flex-col text-left">
            <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm md:text-base">
              {text}
            </span>
            <span className={cn("text-xs font-medium uppercase tracking-wider mt-0.5", config.color)}>
              {variant === "pending" ? "Ação Necessária" : variant}
            </span>
          </div>
        </div>

        {/* Action Arrow */}
        <div className="text-zinc-400 dark:text-zinc-600 group-hover:text-zinc-900 dark:group-hover:text-white transition-transform duration-300 group-hover:translate-x-1">
          <ChevronRight className="w-5 h-5" />
        </div>
      </motion.div>
    </Link>
  );
};

interface ProgressStatusCardProps {
  placementTestIcon?: React.ReactNode;
  contractIcon?: React.ReactNode;
}

const ProgressStatusCard: React.FC<ProgressStatusCardProps> = ({
  placementTestIcon,
  contractIcon,
}) => {
  const t = useTranslations("ProgressStatusCard");
  const { user, isLoading: isUserLoading } = useCurrentUser();
  const { contractStatus, isLoading: isContractLoading } = useContract();
  
  const [placementStatus, setPlacementStatus] = useState<StatusUIProps["variant"]>("pending");
  const [placementText, setPlacementText] = useState<string>(t("placementPending"));

  useEffect(() => {
    const evaluatePlacementStatus = async () => {
      if (!user?.id) {
        setPlacementStatus("pending");
        setPlacementText(t("placementNone"));
        return;
      }

      try {
        const progressRef = doc(db, "placement_progress", user.id);
        const progressSnap = await getDoc(progressRef);

        if (progressSnap.exists()) {
          const progressData = progressSnap.data() as { completed?: boolean };
          if (!progressData.completed) {
            setPlacementStatus("warning");
            setPlacementText(t("placementInProgress"));
            return;
          }
        }

        const resultsQuery = query(
          collection(db, "placement_results"),
          where("userId", "==", user.id),
          orderBy("completedAt", "desc"),
          limit(1)
        );

        const resultsSnap = await getDocs(resultsQuery);

        if (resultsSnap.empty) {
          setPlacementStatus("pending");
          setPlacementText(t("placementNone"));
          return;
        }

        const latest = resultsSnap.docs[0].data() as { completedAt?: any };

        if (!latest.completedAt) {
          setPlacementStatus("pending");
          setPlacementText(t("placementNone"));
          return;
        }

        const completedDate =
          typeof latest.completedAt.toDate === "function"
            ? latest.completedAt.toDate()
            : new Date(latest.completedAt);

        const now = new Date();
        const diffMs = now.getTime() - completedDate.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        const sixMonthsInDays = 6 * 30;

        if (diffDays <= sixMonthsInDays) {
          setPlacementStatus("success");
          setPlacementText(t("placementDone"));
        } else {
          setPlacementStatus("pending");
          setPlacementText(t("placementOutdated"));
        }
      } catch (error) {
        console.error("Error evaluating placement status:", error);
        setPlacementStatus("pending");
        setPlacementText(t("placementNone"));
      }
    };

    evaluatePlacementStatus();
  }, [user?.id, t]);

  // Check contract status
  let contractStatusVariant: StatusUIProps["variant"] = "pending";
  let contractText = t("contractPending");

  if (contractStatus?.cancelledAt) {
    contractStatusVariant = "neutral";
    contractText = t("contractCancelled");
  } else if (
    contractStatus?.expiresAt &&
    new Date(contractStatus.expiresAt) < new Date()
  ) {
    contractStatusVariant = "warning";
    contractText = t("contractExpired");
  } else if (contractStatus?.signed) {
    contractStatusVariant = "success";
    contractText = t("contractSigned");
  }

  // Loading Skeleton Refinado
  if (isUserLoading || isContractLoading) {
    return (
      <div className="flex flex-col gap-3 w-full">
        {[...Array(2)].map((_, index) => (
          <Skeleton key={index} className="flex items-center gap-3 p-4">
             <Skeleton className="h-10 w-10 rounded-lg" />
             <div className="flex flex-col gap-2 flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-16" />
             </div>
          </Skeleton>
        ))}
      </div>
    );
  }

  return (
    <div className="w-full space-y-2">
      <StatusItem
        variant={contractStatusVariant}
        text={contractText}
        link="/hub/student/my-contract"
        icon={contractIcon}
      />
      <StatusItem
        variant={placementStatus}
        text={placementText}
        link="/hub/student/my-placement"
        icon={placementTestIcon}
      />
    </div>
  );
};

export default ProgressStatusCard;