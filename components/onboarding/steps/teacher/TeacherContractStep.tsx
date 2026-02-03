import React, { useState } from "react";
import { TeacherOnboardingStepProps } from "../../TeacherOnboardingModal";
import { Button } from "@/components/ui/button";
import { Check, FileText, PenTool } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TeacherContractPDF } from "./TeacherContractPDF";
import { useTranslations } from "next-intl";

export const TeacherContractStep: React.FC<TeacherOnboardingStepProps> = ({
  data,
  onDataChange,
}) => {
  const t = useTranslations("Onboarding.Teacher.Contract");

  const [formData, setFormData] = useState({
    name: data.nickname || "",
    cnpj: "",
    address: "",
    termsAccepted: false,
  });

  const handleSign = () => {
    if (!formData.name || !formData.address || !formData.termsAccepted) {
      toast.error(t("validationError"));
      return;
    }

    // Simulate signing
    onDataChange({ contractSigned: true });
    toast.success(t("success"));
  };

  if (data.contractSigned) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4 text-center animate-in fade-in zoom-in">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
          <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="text-xl font-bold text-green-700 dark:text-green-300">
          {t("signedTitle")}
        </h3>
        <p className="text-muted-foreground">{t("signedSubtitle")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-1 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <PenTool className="w-5 h-5 text-blue-600" />
          {t("title")}
        </h3>
      </div>

      <div className="h-64 border rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900 relative">
        <div className="absolute inset-0 overflow-y-auto p-4">
          <TeacherContractPDF
            teacherName={formData.name || "__________________"}
            teacherCnpj={formData.cnpj || "__________________"}
            teacherAddress={formData.address || undefined}
          />
        </div>
      </div>

      <div className="grid gap-4 py-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>{t("nameLabel")}</Label>
            <Input
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>{t("cnpjLabel")}</Label>
            <Input
              value={formData.cnpj}
              onChange={(e) =>
                setFormData({ ...formData, cnpj: e.target.value })
              }
              placeholder="00.000.000/0001-00"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>{t("addressLabel")}</Label>
          <Input
            value={formData.address}
            onChange={(e) =>
              setFormData({ ...formData, address: e.target.value })
            }
          />
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
        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        size="lg"
      >
        <PenTool className="w-4 h-4 mr-2" />
        {t("signButton")}
      </Button>
    </div>
  );
};
