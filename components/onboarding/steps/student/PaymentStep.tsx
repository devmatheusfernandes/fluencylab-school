import React, { useState } from "react";
import { OnboardingStepProps } from "../../OnboardingModal";
import { Button } from "@/components/ui/button";
import { QrCode, Copy, CheckCircle, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

export const PaymentStep: React.FC<OnboardingStepProps> = ({
  data,
  onDataChange,
}) => {
  const t = useTranslations("Onboarding.Student.Payment");
  const tMethod = useTranslations("Onboarding.Student.Payment.Method");
  const tToast = useTranslations("Onboarding.Student.Payment.Toast");

  const [generatedPix, setGeneratedPix] = useState<string | null>(null);

  const handleGeneratePix = () => {
    // Simulate API call
    setTimeout(() => {
      setGeneratedPix(
        "00020126580014BR.GOV.BCB.PIX0136123e4567-e89b-12d3-a456-426614174000520400005303986540410.005802BR5913Fluency Lab6008Sao Paulo62070503***6304ABCD",
      );
      toast.success(tToast("success"));
      onDataChange({ paymentMethod: "pix" });
    }, 1000);
  };

  const handleCopyPix = () => {
    if (generatedPix) {
      navigator.clipboard.writeText(generatedPix);
      toast.success("Código copiado!");
    }
  };

  // Simulate payment confirmation
  const handleSimulatePayment = () => {
    onDataChange({ paymentCompleted: true });
    toast.success(t("successTitle"));
  };

  if (data.paymentCompleted) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4 text-center animate-in fade-in zoom-in">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="text-xl font-bold text-green-700 dark:text-green-300">
          {t("successTitle")}
        </h3>
        <p className="text-muted-foreground">{t("successDescription")}</p>
      </div>
    );
  }

  return (
    <div className="container-padding space-y-6 max-w-lg mx-auto">
      <div className="text-center">
        <h3 className="text-xl font-bold">{t("title")}</h3>
      </div>

      {!generatedPix ? (
        <div className="grid gap-4">
          <div
            onClick={handleGeneratePix}
            className="p-6 border-2 border-violet-100 hover:border-violet-500 rounded-xl cursor-pointer transition-all bg-white dark:bg-gray-800 flex items-center gap-4 group"
          >
            <div className="bg-violet-100 dark:bg-violet-900/30 p-3 rounded-full group-hover:bg-violet-200 transition-colors">
              <QrCode className="w-6 h-6 text-violet-600" />
            </div>
            <div className="text-left">
              <h4 className="font-semibold">{tMethod("pix.title")}</h4>
              <p className="text-sm text-muted-foreground">
                {tMethod("pix.description")}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6 text-center animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border inline-block">
            {/* Placeholder QR Code */}
            <div className="w-48 h-48 bg-gray-200 flex items-center justify-center rounded-lg">
              <QrCode className="w-16 h-16 text-gray-400" />
            </div>
          </div>

          <div className="space-y-2">
            <Button
              variant="outline"
              onClick={handleCopyPix}
              className="w-full"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copiar Código PIX
            </Button>

            {/* Dev helper */}
            <Button
              variant="ghost"
              onClick={handleSimulatePayment}
              className="text-xs text-muted-foreground"
            >
              (Dev: Simular Pagamento Confirmado)
            </Button>
          </div>
        </div>
      )}

      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-sm text-blue-800 dark:text-blue-300 space-y-2">
        <div className="flex justify-between">
          <span>{t("billingDayLabel")}</span>
          <span className="font-bold">10</span>
        </div>
        <p className="text-xs opacity-80">{t("billingNote")}</p>
      </div>
    </div>
  );
};
