"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useContract } from "@/hooks/useContract";
import { Text } from "@/components/ui/text";
import { Skeleton } from "../ui/skeleton";

interface StatusUIProps {
  condition: boolean;
  pendingText: string;
  completedText: string;
  link: string;
  icon?: React.ReactNode;
}

const StatusItem: React.FC<StatusUIProps> = ({
  condition,
  pendingText,
  completedText,
  link,
  icon: Icon,
}) => {
  const baseClasses =
    "flex flex-row gap-2 w-full rounded-md text-white font-bold p-3 items-center justify-between transition-all duration-200";

  const bgColor = condition
    ? "bg-teal-700 dark:bg-teal-500"
    : "bg-rose-800 dark:bg-rose-500";

  const text = condition ? completedText : pendingText;

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
  const isPlacementDone = user?.placementDone === true;

  // Check if contract is signed
  const isContractSigned = contractStatus?.signed === true;

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
          condition={isContractSigned}
          pendingText="Contrato Pendente"
          completedText="Contrato Assinado"
          link="/hub/plataforma/student/contrato"
          icon={contractIcon}
        />
        <StatusItem
          condition={isPlacementDone}
          pendingText="Nivelamento Pendente"
          completedText="Nivelamento Completo"
          link="/hub/plataforma/student/nivelamento"
          icon={placementTestIcon}
        />
      </div>
    </div>
  );
};

export default ProgressStatusCard;
