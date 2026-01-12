"use client";

import React, { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useContract } from "@/hooks/useContract";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ContratoPDF from "@/components/contract/ContratoPDF";
import SignatureModal from "@/components/contract/SignatureModal";
import { toast } from "sonner";
import { SignatureFormData, Student } from "@/types/contract";
import { Spinner } from "@/components/ui/spinner";
import { FileWarning, Printer, AlertCircle, CheckCircle2, AlertTriangle, Ban, RefreshCw } from "lucide-react";

const ContratoPage: React.FC = () => {
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
  const contractRef = useRef<HTMLDivElement>(null);

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
        toast.success("Contrato assinado com sucesso por ambas as partes!");
      } else {
        toast.error(result.message || "Erro ao assinar contrato");
      }
    } catch (error) {
      console.error("Error signing contract:", error);
      toast.error("Erro inesperado ao assinar contrato");
    }
  };

  const handleRenew = async () => {
    try {
      setIsRenewing(true);
      const result = await renewContract("manual");
      if (result.success) {
        toast.success("Contrato renovado com sucesso!");
      } else {
        toast.error(result.message || "Erro ao renovar contrato");
      }
    } catch (error) {
      console.error("Error renewing contract:", error);
      toast.error("Erro inesperado ao renovar contrato");
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
        className="flex justify-center items-center min-h-screen bg-slate-500/8 dark:bg-slate-900"
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
        className="container mx-auto p-4 md:p-8 min-h-screen flex flex-col justify-center items-center bg-slate-500/8 dark:bg-slate-900"
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
          Erro ao Carregar Dados
        </motion.h1>

        <Alert className="max-w-md card-base">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || "Não foi possível carregar os dados do aluno para exibir o contrato. Por favor, tente recarregar a página ou contate o suporte."}
          </AlertDescription>
        </Alert>
      </motion.div>
    );
  }

  // Determine contract status
  let status: 'pending' | 'signed' | 'expired' | 'cancelled' = 'pending';
  
  if (contractStatus?.cancelledAt) {
    status = 'cancelled';
  } else if (contractStatus?.expiresAt && new Date(contractStatus.expiresAt) < new Date()) {
    status = 'expired';
  } else if (contractStatus?.signed) {
    status = 'signed';
  }

  const renderStatusAlert = () => {
    switch (status) {
      case 'cancelled':
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
                <span className="font-semibold">Contrato Cancelado</span>
                {contractStatus?.cancelledAt && (
                  <span className="block mt-1 text-sm opacity-80">
                    Cancelado em{" "}
                    {new Date(contractStatus.cancelledAt).toLocaleDateString("pt-BR")}
                  </span>
                )}
                {contractStatus?.cancellationReason && (
                   <span className="block mt-1 text-sm opacity-80">
                     Motivo: {contractStatus.cancellationReason}
                   </span>
                )}
              </AlertDescription>
            </Alert>
          </motion.div>
        );
      case 'expired':
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
                <span className="font-semibold">Contrato Vencido</span>
                {contractStatus?.expiresAt && (
                  <span className="block mt-1 text-sm opacity-80">
                    Venceu em{" "}
                    {new Date(contractStatus.expiresAt).toLocaleDateString("pt-BR")}
                  </span>
                )}
              </AlertDescription>
            </Alert>
          </motion.div>
        );
      case 'signed':
        const daysUntilExpiration = contractStatus?.expiresAt 
          ? Math.ceil((new Date(contractStatus.expiresAt).getTime() - new Date().getTime()) / (1000 * 3600 * 24))
          : 0;
        const showRenewal = daysUntilExpiration <= 30 && daysUntilExpiration > 0;

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
                  <span className="font-semibold">Contrato assinado</span> em{" "}
                  {contractStatus?.signedAt
                    ? new Date(contractStatus.signedAt).toLocaleDateString("pt-BR")
                    : ""}
                  {contractStatus?.expiresAt && (
                    <span className="block mt-1 text-sm opacity-80">
                      Válido até{" "}
                      {new Date(contractStatus.expiresAt).toLocaleDateString("pt-BR")}
                    </span>
                  )}
                  {contractStatus?.autoRenewal !== false && (
                    <span className="block mt-1 text-sm font-medium text-green-800 dark:text-green-200">
                      Renovação Automática: Ativa
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
                    {isRenewing ? "Renovando..." : "Renovar Agora"}
                  </Button>
                )}
              </div>
            </Alert>
          </motion.div>
        );
      default:
        return (
          <motion.div
            key="unsigned-status"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100">
              Contrato
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Revise e assine o contrato abaixo
            </p>
          </motion.div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-500/8 dark:bg-slate-900">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto p-4 md:p-8"
      >
        {/* Header with Status and Action Button */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col justify-between items-start sm:items-center gap-4 mb-6"
        >
          <AnimatePresence mode="wait">
            {renderStatusAlert()}
          </AnimatePresence>

          {/* Action Button */}
          <AnimatePresence mode="wait">
            {status !== 'pending' ? (
              <motion.div
                key="print-button"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }} className="flex-1 w-full"
              >
                <Button
                  disabled={isLoading || isSigning}
                  onClick={handlePrint}
                  className="flex-1 w-full gap-2"
                  size="lg"
                  variant="outline"
                >
                  <Printer size={18} />
                  Imprimir Contrato
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="sign-button"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }} className="flex-1 w-full"
              >
                <Button
                  onClick={() => setIsModalOpen(true)}
                  disabled={isLoading || isSigning}
                  isLoading={isSigning}
                  className="gap-2 flex-1 w-full"
                  size="lg"
                >
                  <Printer size={18} />
                  {isSigning ? "Assinando..." : "Assinar Contrato"}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Contract PDF */}
        <motion.div
          ref={contractRef}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="card-base p-6 md:p-8"
        >
          <ContratoPDF alunoData={displayData} contractStatus={contractStatus} />
        </motion.div>
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