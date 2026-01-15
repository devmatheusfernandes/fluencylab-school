"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useContract } from "@/hooks/useContract";
import { Text } from "@/components/ui/text";
import { Skeleton } from "../ui/skeleton";
import { useTranslations } from "next-intl";
import { doc, getDoc, collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

interface StatusUIProps {
  text: string;
  variant: "success" | "pending" | "warning" | "neutral";
  link: string;
  icon?: React.ReactNode;
}

const StatusItem: React.FC<StatusUIProps> = ({
  text,
  variant,
  link,
  icon: Icon,
}) => {
  const baseClasses =
    "flex flex-row gap-2 w-full rounded-md text-white font-bold p-3 items-center justify-between transition-all duration-200";

  const getBgColor = (variant: StatusUIProps["variant"]) => {
    switch (variant) {
      case "success":
        return "bg-teal-700 dark:bg-teal-500";
      case "pending":
        return "bg-rose-800 dark:bg-rose-500";
      case "warning":
        return "bg-amber-600 dark:bg-amber-500";
      case "neutral":
        return "bg-slate-600 dark:bg-slate-500";
      default:
        return "bg-gray-500";
    }
  };

  const bgColor = getBgColor(variant);

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      <Link href={link} className={`${baseClasses} ${bgColor}`}>
        <span className="flex flex-row w-full justify-between items-center">
          {text}
          {Icon && <span className="w-6 h-6">{Icon}</span>}
        </span>
      </Link>
    </motion.div>
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
  const [placementStatus, setPlacementStatus] =
    useState<StatusUIProps["variant"]>("pending");
  const [placementText, setPlacementText] = useState<string>(
    t("placementPending")
  );

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

  // Show loading state while data is being fetched
  if (isUserLoading || isContractLoading) {
    return (
      <div>
        <Skeleton className="skeleton-sub h-6 w-28 my-1" />
        <div className="space-y-2">
          {[...Array(2)].map((_, index) => (
            <Skeleton
              key={index}
              className="skeleton-base h-12 w-full rounded-md"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <Text variant="subtitle" size="lg" weight="semibold" className="my-1">
        {t("checklist")}
      </Text>
      <div className="space-y-2">
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
    </div>
  );
};

export default ProgressStatusCard;
