"use client";

import React, { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useContract } from "@/hooks/financial/useContract";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ContratoPDF from "@/components/contract/ContratoPDF";
import SignatureModal from "@/components/contract/SignatureModal";
import { toast } from "sonner";
import { SignatureFormData, Student } from "@/types/contract";
import { Spinner } from "@/components/ui/spinner";
import {
  FileWarning,
  Printer,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Ban,
  RefreshCw,
  EyeOff,
  Eye,
  ArrowLeft,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Header } from "@/components/ui/header";
import Link from "next/link";
import BreadcrumbActionIcon from "@/components/shared/Breadcrum/BreadcrumbActionIcon";
import BreadcrumbActions from "@/components/shared/Breadcrum/BreadcrumbActions";

const ContratoPage: React.FC = () => {
  const t = useTranslations("StudentContract");
  const {
    student,
    contractStatus,
    contractLog,
    isLoading,
    isSigning,
    error,
    signContract,
    renewContract,
  } = useContract();

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isRenewing, setIsRenewing] = React.useState(false);
  const [showContract, setShowContract] = React.useState(false);
  const contractRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (contractStatus) {
      const isExpired =
        contractStatus.expiresAt &&
        new Date(contractStatus.expiresAt) < new Date();
      const isCancelled = !!contractStatus.cancelledAt;
      const isSigned = !!contractStatus.signed;

      if (!isSigned && !isCancelled && !isExpired) {
        setShowContract(true);
      }
    }
  }, [contractStatus]);

  const displayData: Student | null = React.useMemo(() => {
    if (!student) return null;

    return {
      ...student,
      ...(contractLog && {
        name: contractLog.name,
        cpf: contractLog.cpf,
        address: contractLog.address,
        city: contractLog.city,
        state: contractLog.state,
        zipCode: contractLog.zipCode,
        birthDate: contractLog.birthDate,
      }),
    };
  }, [student, contractLog]);

  const handleSignContract = async (signatureData: SignatureFormData) => {
    try {
      const result = await signContract(signatureData);

      if (result.success) {
        setIsModalOpen(false);
        toast.success(t("signedSuccess"));
      } else {
        toast.error(result.message || t("signError"));
      }
    } catch (error) {
      console.error("Error signing contract:", error);
      toast.error(t("unexpectedSignError"));
    }
  };

  const handleRenew = async () => {
    try {
      setIsRenewing(true);
      const result = await renewContract("manual");
      if (result.success) {
        toast.success(t("renewSuccess"));
      } else {
        toast.error(result.message || t("renewError"));
      }
    } catch (error) {
      console.error("Error renewing contract:", error);
      toast.error(t("unexpectedRenewError"));
    } finally {
      setIsRenewing(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex justify-center items-center min-h-screen"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Spinner />
        </motion.div>
      </motion.div>
    );
  }

  if (error || !displayData) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="container mx-auto p-4 md:p-8 min-h-screen flex flex-col justify-center items-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        >
          <FileWarning
            className="text-red-500 dark:text-red-400 mx-auto mb-6"
            size={64}
          />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-2xl md:text-3xl font-bold mb-4 text-red-600 dark:text-red-400"
        >
          {t("errorLoadingTitle")}
        </motion.h1>

        <Alert className="max-w-md card-base">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || t("errorLoadingMessage")}
          </AlertDescription>
        </Alert>
      </motion.div>
    );
  }

  // Determine contract status
  let status: "pending" | "signed" | "expired" | "cancelled" = "pending";

  if (contractStatus?.cancelledAt) {
    status = "cancelled";
  } else if (
    contractStatus?.expiresAt &&
    new Date(contractStatus.expiresAt) < new Date()
  ) {
    status = "expired";
  } else if (contractStatus?.signed) {
    status = "signed";
  }

  const renderStatusAlert = () => {
    switch (status) {
      case "cancelled":
        return (
          <motion.div
            key="cancelled-status"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex-1 w-full"
          >
            <Alert className="card-base border-slate-500/50 dark:border-slate-400/50 bg-slate-100 dark:bg-slate-800/50">
              <Ban className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              <AlertDescription className="text-slate-700 dark:text-slate-300">
                <span className="font-semibold">{t("cancelledTitle")}</span>
                {contractStatus?.cancelledAt && (
                  <span className="block mt-1 text-sm opacity-80">
                    {t("cancelledOn", {
                      date: new Date(
                        contractStatus.cancelledAt,
                      ).toLocaleDateString("pt-BR"),
                    })}
                  </span>
                )}
                {contractStatus?.cancellationReason && (
                  <span className="block mt-1 text-sm opacity-80">
                    {t("cancellationReason", {
                      reason: contractStatus.cancellationReason,
                    })}
                  </span>
                )}
              </AlertDescription>
            </Alert>
          </motion.div>
        );
      case "expired":
        return (
          <motion.div
            key="expired-status"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex-1 w-full"
          >
            <Alert className="card-base border-amber-500/50 dark:border-amber-400/50 bg-amber-50 dark:bg-amber-900/10">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <AlertDescription className="text-amber-700 dark:text-amber-300">
                <span className="font-semibold">{t("expiredTitle")}</span>
                {contractStatus?.expiresAt && (
                  <span className="block mt-1 text-sm opacity-80">
                    {t("expiredOn", {
                      date: new Date(
                        contractStatus.expiresAt,
                      ).toLocaleDateString("pt-BR"),
                    })}
                  </span>
                )}
              </AlertDescription>
            </Alert>
          </motion.div>
        );
      case "signed":
        const daysUntilExpiration = contractStatus?.expiresAt
          ? Math.ceil(
              (new Date(contractStatus.expiresAt).getTime() -
                new Date().getTime()) /
                (1000 * 3600 * 24),
            )
          : 0;
        const showRenewal =
          daysUntilExpiration <= 30 && daysUntilExpiration > 0;

        return (
          <motion.div
            key="signed-status"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex-1 w-full"
          >
            <Alert className="card-base border-green-500/50 dark:border-green-400/50">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <div className="flex flex-col gap-2 w-full">
                <AlertDescription className="text-green-700 dark:text-green-300">
                  <span className="font-semibold">{t("signedTitle")}</span>{" "}
                  {contractStatus?.signedAt
                    ? t("signedOn", {
                        date: new Date(
                          contractStatus.signedAt,
                        ).toLocaleDateString("pt-BR"),
                      })
                    : ""}
                  {contractStatus?.expiresAt && (
                    <span className="block mt-1 text-sm opacity-80">
                      {t("validUntil", {
                        date: new Date(
                          contractStatus.expiresAt,
                        ).toLocaleDateString("pt-BR"),
                      })}
                    </span>
                  )}
                  {contractStatus?.autoRenewal !== false && (
                    <span className="block mt-1 text-sm font-medium text-green-800 dark:text-green-200">
                      {t("autoRenewalActive")}
                    </span>
                  )}
                </AlertDescription>

                {showRenewal && (
                  <Button
                    onClick={handleRenew}
                    disabled={isRenewing}
                    size="sm"
                    className="w-full sm:w-auto mt-2 bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isRenewing ? (
                      <Spinner className="mr-2 h-4 w-4" />
                    ) : (
                      <RefreshCw className="mr-2 h-4 w-4" />
                    )}
                    {isRenewing ? t("renewingButton") : t("renewButton")}
                  </Button>
                )}
              </div>
            </Alert>
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="container-padding space-y-6">
      {
        <BreadcrumbActions placement="start">
          <Link href="/hub/student/my-profile" className="flex items-center">
            <BreadcrumbActionIcon icon={ArrowLeft} />
          </Link>
        </BreadcrumbActions>
      }
      {
        <BreadcrumbActions placement="end">
          <BreadcrumbActionIcon
            icon={showContract ? EyeOff : Eye}
            onClick={() => setShowContract(!showContract)}
          />
        </BreadcrumbActions>
      }

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Header
          heading={t("pageTitle")}
          subheading={
            status === "pending" ? t("pageSubtitle") : t("headerSubtitle")
          }
          className="mb-8"
          icon={
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowContract(!showContract)}
              className="gap-2"
            >
              {showContract ? (
                <EyeOff className="h-4 w-4 mr-2" />
              ) : (
                <Eye className="h-4 w-4 mr-2" />
              )}
              {showContract ? t("hideContract") : t("viewContract")}
            </Button>
          }
        />

        {/* Status Alert */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <AnimatePresence mode="wait">{renderStatusAlert()}</AnimatePresence>
        </motion.div>

        <AnimatePresence>
          {showContract && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              {/* Action Buttons */}
              <div className="flex justify-end mb-4">
                {status !== "pending" ? (
                  <Button
                    disabled={isLoading || isSigning}
                    onClick={handlePrint}
                    className="w-full sm:w-auto"
                    size="lg"
                    variant="outline"
                  >
                    <Printer size={18} className="mr-2" />
                    {t("printButton")}
                  </Button>
                ) : (
                  <Button
                    onClick={() => setIsModalOpen(true)}
                    disabled={isLoading || isSigning}
                    isLoading={isSigning}
                    className="gap-2 w-full sm:w-auto"
                    size="lg"
                  >
                    <Printer size={18} />
                    {isSigning ? t("signingButton") : t("signButton")}
                  </Button>
                )}
              </div>

              {/* Contract PDF */}
              <div
                ref={contractRef}
                className="p-6 md:p-8 border rounded-lg bg-card text-card-foreground shadow-sm"
              >
                <ContratoPDF
                  alunoData={displayData}
                  contractStatus={contractStatus}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Signature Modal */}
      {displayData && (
        <SignatureModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSignContract}
          studentName={displayData.name || ""}
        />
      )}
    </div>
  );
};

export default ContratoPage;
