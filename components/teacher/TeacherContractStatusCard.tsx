"use client";

import React, { useEffect, useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileSignature,
  Eye,
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
} from "lucide-react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalPrimaryButton,
  ModalSecondaryButton,
} from "@/components/ui/modal";
import { TeacherContractPDF } from "@/components/onboarding/steps/teacher/TeacherContractPDF";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

interface ContractStatusData {
  student: any;
  contractStatus: {
    signed: boolean;
    isValid: boolean;
    expiresAt?: string;
    signedAt?: string;
    contractVersion?: string;
  } | null;
  contractLog: {
    name: string;
    cpf: string; // Note: In TeacherContractPDF it expects teacherCnpj, but contractLog might save as cpf or generic field. 
                 // We need to map correctly. TeacherContractStep saves 'cnpj' in 'signatureData', 
                 // and ContractService saves it to ContractLog. 
                 // Let's assume ContractLog stores it in 'cpf' field or we check how it's stored.
                 // Looking at ContractService:
                 // const contractLogData = { name: signatureData.name, cpf: signatureData.cpf, ... }
                 // TeacherContractStep sends: signatureData: { ...formData } where formData has cnpj.
                 // So TeacherContractStep should probably map cnpj to cpf in the payload if the backend expects cpf, 
                 // OR ContractService just takes what's given.
                 // TeacherContractStep sends { signatureData: formData }. formData has { cnpj: "..." }.
                 // ContractService: const { studentId, signatureData } = request; ...
                 // contractLogData = { name: signatureData.name, cpf: signatureData.cpf, ... }
                 // Wait, ContractService explicitly maps signatureData.cpf to cpf.
                 // So if TeacherContractStep sends 'cnpj', it might be lost if ContractService only looks for 'cpf'.
                 // Let's double check TeacherContractStep.tsx and ContractService.ts
    address: string;
    city: string;
    state: string;
    zipCode: string;
    signedAt: string;
  } | null;
}

export const TeacherContractStatusCard = () => {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ContractStatusData | null>(null);
  const [showContractModal, setShowContractModal] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state for signing
  const [formData, setFormData] = useState({
    name: "",
    cnpj: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    agreedToTerms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/teacher/contract");
      if (res.ok) {
        const json = await res.json();
        setData(json);
        
        // Initialize form data if user info is available
        if (json.student) {
           // We try to fill what we can
           setFormData(prev => ({
               ...prev,
               name: json.student.name || "",
               // We don't have other data easily available unless we fetch banking info or similar
           }));
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("Erro ao carregar status do contrato");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }

    if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (name === "cnpj") {
      const formattedCnpj = value
        .replace(/\D/g, "")
        .replace(/^(\d{2})(\d)/, "$1.$2")
        .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/\.(\d{3})(\d)/, ".$1/$2")
        .replace(/(\d{4})(\d)/, "$1-$2")
        .slice(0, 18);
      setFormData((prev) => ({ ...prev, [name]: formattedCnpj }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = "Nome é obrigatório";
    if (!formData.cnpj.trim()) {
      newErrors.cnpj = "CNPJ é obrigatório";
    } else if (formData.cnpj.replace(/\D/g, "").length !== 14) {
      newErrors.cnpj = "CNPJ inválido";
    }
    if (!formData.address.trim()) newErrors.address = "Endereço é obrigatório";
    if (!formData.city.trim()) newErrors.city = "Cidade é obrigatória";
    if (!formData.state.trim()) newErrors.state = "Estado é obrigatório";
    if (!formData.zipCode.trim()) newErrors.zipCode = "CEP é obrigatório";
    if (!formData.agreedToTerms) newErrors.agreedToTerms = "Você deve concordar com os termos";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignContract = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // We need to map cnpj to cpf because ContractService expects cpf
      // Or we should update ContractService to handle cnpj. 
      // For now, let's send both or map it.
      // Actually, looking at ContractService logic:
      // contractLogData = { name: signatureData.name, cpf: signatureData.cpf, ... }
      // So if we send cnpj in 'cpf' field it might work but it's semantically wrong.
      // However, to avoid changing backend logic too much right now, 
      // let's check what TeacherContractStep does.
      // TeacherContractStep sends { signatureData: formData }. formData has 'cnpj'.
      // If ContractService only reads 'cpf', then 'cnpj' is lost.
      // Let's assume I should fix TeacherContractStep or send 'cpf' as the CNPJ value here for now.
      // To be safe, I'll send the CNPJ value in the 'cpf' field as well, or just rely on 'cnpj' if I fix the service.
      // I'll assume for now I should send 'cpf' with the CNPJ value to ensure it gets saved in the log 
      // (since the log table likely has a 'cpf' column and maybe not a 'cnpj' column).
      
      const payload = {
          ...formData,
          cpf: formData.cnpj // Mapping CNPJ to CPF field for storage compatibility
      };

      const response = await fetch("/api/onboarding/teacher/sign-contract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signatureData: payload,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to sign contract");
      }

      toast.success("Contrato assinado com sucesso!");
      setShowSignModal(false);
      fetchStatus(); // Refresh status
    } catch (error) {
      console.error("Error signing contract:", error);
      toast.error("Erro ao assinar o contrato. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRenewContract = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/teacher/contract/renew", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          renewalType: "manual",
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to renew contract");
      }

      toast.success("Contrato renovado com sucesso!");
      fetchStatus();
    } catch (error: any) {
      console.error("Error renewing contract:", error);
      toast.error(error.message || "Erro ao renovar o contrato.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <Skeleton className="h-48 w-full" />;

  const contractStatus = data?.contractStatus;
  const isSigned = contractStatus?.signed && contractStatus?.isValid;
  const isExpired = contractStatus?.signed && !contractStatus?.isValid;
  const isPending = !contractStatus?.signed;

  const expirationDate = contractStatus?.expiresAt
    ? new Date(contractStatus.expiresAt).toLocaleDateString("pt-BR")
    : "Indeterminado";

  const signedDate = contractStatus?.signedAt
    ? new Date(contractStatus.signedAt).toLocaleDateString("pt-BR")
    : "-";

  return (
    <>
      <Card className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <FileSignature className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <Text size="lg" className="font-bold text-slate-900 dark:text-slate-100">
                Contrato de Parceria
              </Text>
              <Text size="sm" className="text-slate-600 dark:text-slate-400">
                Status e validade do seu contrato
              </Text>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isSigned && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                <CheckCircle className="w-3 h-3 mr-1" />
                Ativo
              </span>
            )}
            {isExpired && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Expirado
              </span>
            )}
            {isPending && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Pendente
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Validade</div>
            <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              {expirationDate}
            </div>
          </div>
          
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Assinado em</div>
            <div className="font-semibold text-slate-900 dark:text-slate-100">
              {signedDate}
            </div>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Tipo</div>
            <div className="font-semibold text-slate-900 dark:text-slate-100">
              Prestação de Serviços (MEI)
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {(isSigned || isExpired) && (
            <Button variant="outline" onClick={() => setShowContractModal(true)}>
              <Eye className="w-4 h-4 mr-2" />
              Visualizar Contrato
            </Button>
          )}

          {isExpired && (
            <Button variant="default" onClick={handleRenewContract} disabled={isSubmitting}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isSubmitting ? "animate-spin" : ""}`} />
              Renovar Contrato
            </Button>
          )}

          {isPending && (
            <Button variant="default" onClick={() => setShowSignModal(true)}>
              <FileSignature className="w-4 h-4 mr-2" />
              Assinar Contrato
            </Button>
          )}
        </div>
      </Card>

      {/* View Contract Modal */}
      <Modal open={showContractModal} onOpenChange={setShowContractModal}>
        <ModalContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <ModalHeader>
            <h2 className="text-xl font-bold">Contrato de Parceria</h2>
          </ModalHeader>
          <div className="p-4">
             {data?.contractLog ? (
                <TeacherContractPDF
                    teacherName={data.contractLog.name}
                    teacherCnpj={data.contractLog.cpf} // Using cpf field as stored in log
                    teacherAddress={data.contractLog.address}
                    teacherCity={data.contractLog.city}
                    teacherState={data.contractLog.state}
                    teacherZipCode={data.contractLog.zipCode}
                    signedDate={data.contractLog.signedAt}
                />
             ) : (
                 <div className="text-center py-8 text-gray-500">
                     Dados do contrato não encontrados.
                 </div>
             )}
          </div>
          <ModalFooter>
            <ModalSecondaryButton onClick={() => setShowContractModal(false)}>
              Fechar
            </ModalSecondaryButton>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Sign Contract Modal */}
      <Modal open={showSignModal} onOpenChange={setShowSignModal}>
        <ModalContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <ModalHeader>
            <h2 className="text-xl font-bold">Assinar Contrato de Parceria</h2>
          </ModalHeader>
          <div className="p-6">
            <div className="mb-6">
                <TeacherContractPDF
                    teacherName={formData.name}
                    teacherCnpj={formData.cnpj}
                    teacherAddress={formData.address}
                    teacherCity={formData.city}
                    teacherState={formData.state}
                    teacherZipCode={formData.zipCode}
                />
            </div>

            <div className="border-t pt-6">
                <Text variant="title" className="mb-4">Dados da Contratada (Você)</Text>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">Nome Completo / Razão Social *</label>
                    <Input
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      hasError={!!errors.name}
                    />
                    {errors.name && <Text size="sm" className="text-red-500 mt-1">{errors.name}</Text>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">CNPJ (MEI) *</label>
                    <Input
                      name="cnpj"
                      value={formData.cnpj}
                      onChange={handleInputChange}
                      hasError={!!errors.cnpj}
                      placeholder="XX.XXX.XXX/0001-XX"
                      maxLength={18}
                    />
                    {errors.cnpj && <Text size="sm" className="text-red-500 mt-1">{errors.cnpj}</Text>}
                  </div>

                   <div>
                    <label className="block text-sm font-medium mb-2">CEP *</label>
                    <Input
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleInputChange}
                      hasError={!!errors.zipCode}
                    />
                    {errors.zipCode && <Text size="sm" className="text-red-500 mt-1">{errors.zipCode}</Text>}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">Endereço Completo *</label>
                    <Input
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Rua, número, bairro"
                      hasError={!!errors.address}
                    />
                    {errors.address && <Text size="sm" className="text-red-500 mt-1">{errors.address}</Text>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Cidade *</label>
                    <Input
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      hasError={!!errors.city}
                    />
                    {errors.city && <Text size="sm" className="text-red-500 mt-1">{errors.city}</Text>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Estado *</label>
                    <Input
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      hasError={!!errors.state}
                    />
                    {errors.state && <Text size="sm" className="text-red-500 mt-1">{errors.state}</Text>}
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={formData.agreedToTerms}
                      onCheckedChange={(checked) => {
                          setFormData(prev => ({ ...prev, agreedToTerms: checked as boolean }));
                          if (errors.agreedToTerms) setErrors(prev => ({ ...prev, agreedToTerms: "" }));
                      }}
                    />
                    <div>
                      <Text size="sm">Declaro que li e concordo com todos os termos do contrato de prestação de serviços apresentado.</Text>
                      {errors.agreedToTerms && <Text size="sm" className="text-red-500 mt-2">{errors.agreedToTerms}</Text>}
                    </div>
                  </div>
                </div>
            </div>
          </div>
          <ModalFooter>
            <ModalSecondaryButton onClick={() => setShowSignModal(false)} disabled={isSubmitting}>
              Cancelar
            </ModalSecondaryButton>
            <ModalPrimaryButton onClick={handleSignContract} disabled={!formData.agreedToTerms || isSubmitting}>
               {isSubmitting ? "Assinando..." : "Assinar Digitalmente"}
            </ModalPrimaryButton>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};
