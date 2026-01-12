"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useContract } from "@/hooks/useContract";
import { Text } from "@/components/ui/text";
import { Skeleton } from "../ui/skeleton";

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
  const { user, isLoading: isUserLoading } = useCurrentUser();
  const { contractStatus, isLoading: isContractLoading } = useContract();

  // Check if placement test is completed
  const placementStatus: StatusUIProps["variant"] =
    user?.placementDone === true ? "success" : "pending";
  const placementText =
    user?.placementDone === true
      ? "Nivelamento Completo"
      : "Nivelamento Pendente";

  // Check contract status
  let contractStatusVariant: StatusUIProps["variant"] = "pending";
  let contractText = "Contrato Pendente";

  if (contractStatus?.cancelledAt) {
    contractStatusVariant = "neutral";
    contractText = "Contrato Cancelado";
  } else if (
    contractStatus?.expiresAt &&
    new Date(contractStatus.expiresAt) < new Date()
  ) {
    contractStatusVariant = "warning";
    contractText = "Contrato Vencido";
  } else if (contractStatus?.signed) {
    contractStatusVariant = "success";
    contractText = "Contrato Assinado";
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
        Checklist
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
          link="/hub/student/my-placement-test"
          icon={placementTestIcon}
        />
      </div>
    </div>
  );
};

export default ProgressStatusCard;
