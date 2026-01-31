"use client";

import React, { useState } from "react";
import { TeacherOnboardingStepProps } from "../../TeacherOnboardingModal";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { ScrollText, PenTool, Check } from "lucide-react";
import { TeacherContractPDF } from "./TeacherContractPDF"; // Supondo existência
import { Label } from "@/components/ui/label";
import { CircleCheckIcon } from "@/public/animated/circle-check";

export const TeacherContractStep: React.FC<TeacherOnboardingStepProps> = ({
  data,
  onDataChange,
}) => {
  const { data: session } = useSession();
  const [showPDF, setShowPDF] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: data.bankingInfo.fullName || session?.user?.name || "",
    cnpj: "", // Opcional para professor PJ
    address: "",
    city: "",
    state: "",
    zipCode: "",
    agreedToTerms: false,
  });

  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  // Check contract status on mount
  React.useEffect(() => {
    const checkStatus = async () => {
      if (data.contractSigned) return;

      setIsCheckingStatus(true);
      try {
        const res = await fetch("/api/teacher/contract");
        if (res.ok) {
          const json = await res.json();
          // Check if contract is signed and valid
          if (json.contractStatus?.signed && json.contractStatus?.isValid) {
            onDataChange({ contractSigned: true });
          }
        }
      } catch (error) {
        console.error("Error checking contract status:", error);
      } finally {
        setIsCheckingStatus(false);
      }
    };

    checkStatus();
  }, []);

  const handleSign = async () => {
    if (!formData.name || !formData.address || !formData.agreedToTerms) {
      toast.error("Preencha os dados e aceite os termos.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Prepare payload with signatureData wrapper as expected by the API
      // Use CNPJ as CPF if provided (for MEI), otherwise fall back to banking info CPF
      const payload = {
        ...formData,
        cpf: formData.cnpj || data.bankingInfo.cpf || "",
      };

      // Simulação de chamada API
      const res = await fetch("/api/onboarding/teacher/sign-contract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signatureData: payload }),
      });

      if (!res.ok) {
        const err = await res.json();
        // If contract is already signed, treat as success
        if (err.message === "Contrato já assinado e válido") {
          onDataChange({ contractSigned: true });
          toast.info("Contrato já estava assinado.");
          return;
        }
        throw new Error(err.message || "Erro ao assinar contrato");
      }

      onDataChange({ contractSigned: true });
      toast.success("Contrato de Prestação de Serviços assinado!");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Erro ao assinar contrato.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (data.contractSigned) {
    return (
      <div className="flex flex-col items-center justify-center p-8 min-h-[40vh] text-center">
        <CircleCheckIcon size={80} className="text-emerald-500 mb-4" />
        <h3 className="text-xl font-bold text-emerald-700">
          Contrato Assinado
        </h3>
        <p className="text-gray-500 mt-2">
          Você está pronto para começar a lecionar.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold">Contrato de Parceria</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowPDF(!showPDF)}
        >
          <ScrollText className="w-4 h-4 mr-2" /> {showPDF ? "Ocultar" : "Ler"}{" "}
          Contrato
        </Button>
      </div>

      {showPDF && (
        <Card className="mb-6 h-64 overflow-y-auto p-4 bg-gray-50 text-xs border">
          {/* <TeacherContractPDF data={formData} /> */}
        </Card>
      )}

      <Card className="p-6 space-y-4">
        <div className="space-y-2">
          <Label>Nome Completo / Razão Social</Label>
          <Input name="name" value={formData.name} onChange={handleChange} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>CNPJ (Opcional)</Label>
            <Input
              name="cnpj"
              value={formData.cnpj}
              onChange={handleChange}
              placeholder="00.000.000/0001-00"
            />
          </div>
          <div className="space-y-2">
            <Label>CEP</Label>
            <Input
              name="zipCode"
              value={formData.zipCode}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Endereço Completo</Label>
          <Input
            name="address"
            value={formData.address}
            onChange={handleChange}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            name="city"
            value={formData.city}
            onChange={handleChange}
            placeholder="Cidade"
          />
          <Input
            name="state"
            value={formData.state}
            onChange={handleChange}
            placeholder="UF"
          />
        </div>

        <div className="flex items-start gap-3 pt-4 border-t mt-4">
          <Checkbox
            checked={formData.agreedToTerms}
            onCheckedChange={(c) =>
              setFormData((p) => ({ ...p, agreedToTerms: c as boolean }))
            }
          />
          <p className="text-sm text-gray-600">
            Li e concordo com os termos de parceria e prestação de serviços
            educacionais.
          </p>
        </div>

        <Button
          onClick={handleSign}
          disabled={!formData.agreedToTerms || isSubmitting}
          isLoading={isSubmitting}
          className="w-full"
          variant="success"
        >
          <PenTool className="w-4 h-4 mr-2" /> Assinar Digitalmente
        </Button>
      </Card>
    </div>
  );
};
