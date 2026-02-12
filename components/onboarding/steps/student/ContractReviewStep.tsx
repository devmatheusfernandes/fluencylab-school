import React, { useState } from "react";
import { OnboardingStepProps } from "../../OnboardingModal";
import { Button } from "@/components/ui/button";
import { Check, ChevronDown, ChevronUp, PenTool, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import ContratoPDF from "@/components/contract/ContratoPDF";
import { validateCPF, formatCPF, cleanCPF } from "@/lib/validation/cpf";

export const ContractReviewStep: React.FC<OnboardingStepProps> = ({
  data,
  onDataChange,
}) => {
  const t = useTranslations("Onboarding.Student.ContractReview");
  const tValidation = useTranslations(
    "Onboarding.Student.ContractReview.Validation",
  );
  const tForm = useTranslations("Onboarding.Student.ContractReview.Form");
  const tAddress = useTranslations(
    "Onboarding.Student.ContractReview.Form.address",
  );

  const { data: session } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const [formData, setFormData] = useState({
    name: data.nickname || session?.user?.name || "",
    cpf: "",
    birthDate: "",
    phone: "",
    address: {
      zipCode: "",
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
    },
    termsAccepted: false,
  });

  const updateAddress = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      address: { ...prev.address, [field]: value },
    }));
  };

  const handleSign = async () => {
    // 1. Validação de Campos Vazios
    if (
      !formData.name ||
      !formData.cpf ||
      !formData.address.street ||
      !formData.address.city ||
      !formData.address.zipCode
    ) {
      toast.error(tValidation("fillAll"));
      return;
    }

    // 2. Validação dos Termos
    if (!formData.termsAccepted) {
      toast.error(tValidation("acceptTerms"));
      return;
    }

    // 3. Validação REAL do CPF (Usando seu lib)
    if (!validateCPF(formData.cpf)) {
      toast.error(tValidation("invalidCPF"));
      return;
    }

    setIsSubmitting(true);

    try {
      const fullAddressString = `${formData.address.street}, ${formData.address.number} ${formData.address.complement ? `- ${formData.address.complement}` : ""} - ${formData.address.neighborhood}`;

      // Limpa o CPF antes de enviar para o Backend (apenas números)
      const cleanedCPF = cleanCPF(formData.cpf);

      const signaturePayload = {
        name: formData.name,
        cpf: cleanedCPF, // Envia limpo
        birthDate: formData.birthDate,
        phone: formData.phone,
        zipCode: formData.address.zipCode,
        address: fullAddressString,
        city: formData.address.city,
        state: formData.address.state,
        agreedToTerms: formData.termsAccepted,
        email: session?.user?.email || "",
      };

      const res = await fetch("/api/onboarding/sign-contract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signatureData: signaturePayload,
          contractLengthMonths: data.contractLengthMonths,
        }),
      });

      if (!res.ok) throw new Error("Erro ao assinar");

      const result = await res.json();

      onDataChange({
        contractSigned: true,
        phoneNumber: formData.phone,
        cpf: cleanedCPF,
        contractData: result.contractStatus || {
          signedAt: new Date().toISOString(),
          signerName: formData.name,
          signerCpf: cleanedCPF,
          signerPhone: formData.phone,
        },
      });

      toast.success(t("signedSuccess"));
    } catch (e) {
      console.error(e);
      toast.error(t("signedError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (data.contractSigned) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4 text-center animate-in fade-in zoom-in">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
          <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="text-xl font-bold text-green-700 dark:text-green-300">
          {t("successTitle")}
        </h3>
        <p className="text-muted-foreground">{t("successDescription")}</p>
      </div>
    );
  }

  // Para o PDF Preview, mantemos o CPF formatado (com pontos e traço) para ficar bonito visualmente
  const previewData = {
    name: formData.name,
    cpf: formData.cpf,
    birthDate: formData.birthDate,
    email: session?.user?.email || "",
    address: `${formData.address.street}, ${formData.address.number}`,
    city: formData.address.city,
    state: formData.address.state,
    zipCode: formData.address.zipCode,
    id: session?.user?.id || "",
  };

  return (
    <div className="space-y-6 p-1">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <PenTool className="w-5 h-5 text-violet-500" />
          {t("title")}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs"
        >
          {isExpanded ? (
            <>
              {t("hideContract")} <ChevronUp className="w-3 h-3 ml-1" />
            </>
          ) : (
            <>
              {t("viewContract")} <ChevronDown className="w-3 h-3 ml-1" />
            </>
          )}
        </Button>
      </div>

      {isExpanded && (
        <div className="h-64 overflow-y-auto border rounded-lg p-4 bg-gray-50 dark:bg-gray-900 text-sm">
          <ContratoPDF alunoData={previewData} contractStatus={null} />
        </div>
      )}

      <div className="grid gap-4 py-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>{tForm("name")}</Label>
            <Input
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>

          {/* INPUT DE CPF ATUALIZADO */}
          <div className="space-y-2">
            <Label>{tForm("cpf")}</Label>
            <Input
              value={formData.cpf}
              onChange={(e) =>
                // Aplica formatação automática enquanto digita
                setFormData({ ...formData, cpf: formatCPF(e.target.value) })
              }
              placeholder="000.000.000-00"
              maxLength={14} // Limita caracteres (11 dígitos + 3 símbolos)
            />
          </div>

          <div className="space-y-2">
            <Label>{tForm("birthDate")}</Label>
            <Input
              type="date"
              value={formData.birthDate}
              onChange={(e) =>
                setFormData({ ...formData, birthDate: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>{tForm("phone")}</Label>
            <Input
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              placeholder="(00) 00000-0000"
            />
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t">
          <Label>{tAddress("title")}</Label>
          <div className="grid grid-cols-2 gap-3">
            <Input
              placeholder={tAddress("zip")}
              value={formData.address.zipCode}
              onChange={(e) => updateAddress("zipCode", e.target.value)}
            />
            <Input
              placeholder={tAddress("street")}
              value={formData.address.street}
              onChange={(e) => updateAddress("street", e.target.value)}
            />
            <Input
              placeholder={tAddress("number")}
              className="col-span-1"
              value={formData.address.number}
              onChange={(e) => updateAddress("number", e.target.value)}
            />
            <Input
              placeholder={tAddress("complement")}
              value={formData.address.complement}
              onChange={(e) => updateAddress("complement", e.target.value)}
            />
            <Input
              placeholder={tAddress("neighborhood")}
              value={formData.address.neighborhood}
              onChange={(e) => updateAddress("neighborhood", e.target.value)}
            />
            <Input
              placeholder={tAddress("city")}
              value={formData.address.city}
              onChange={(e) => updateAddress("city", e.target.value)}
            />
            <Input
              placeholder={tAddress("state")}
              value={formData.address.state}
              onChange={(e) => updateAddress("state", e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex items-start space-x-2 pt-2">
        <Checkbox
          id="terms"
          checked={formData.termsAccepted}
          onCheckedChange={(checked) =>
            setFormData({ ...formData, termsAccepted: checked === true })
          }
        />
        <label
          htmlFor="terms"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {t("terms")}
        </label>
      </div>

      <Button
        onClick={handleSign}
        disabled={isSubmitting || !formData.termsAccepted}
        className="w-full bg-violet-600 hover:bg-violet-700 text-white"
        size="lg"
      >
        {isSubmitting ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <PenTool className="w-4 h-4 mr-2" />
        )}
        {t("signButton")}
      </Button>
    </div>
  );
};
