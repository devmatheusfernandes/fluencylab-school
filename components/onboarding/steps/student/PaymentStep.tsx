import React, { useState } from "react";
import { OnboardingStepProps } from "../../OnboardingModal";
import { Button } from "@/components/ui/button";
import { QrCode, Calendar, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { formatPrice } from "@/config/pricing";

export const PaymentStep: React.FC<OnboardingStepProps> = ({
  data,
  onDataChange,
}) => {
  const t = useTranslations("Onboarding.Student.Payment");
  const tMethod = useTranslations("Onboarding.Student.Payment.Method");

  // States
  const [billingDay, setBillingDay] = useState<number>(10);
  const [loading, setLoading] = useState(false);

  // Cálculo de Preço
  const basePrice = 29900;
  const price =
    data.contractLengthMonths === 12 ? Math.round(basePrice * 0.85) : basePrice;

  const handleCreateSubscription = async () => {
    setLoading(true);
    console.log(data);
    try {
      const res = await fetch("/api/onboarding/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMethod: "pix",
          billingDay,
          contractLengthMonths: data.contractLengthMonths,
          cellPhone: data?.phoneNumber,
          taxId: data.cpf,
        }),
      });

      if (!res.ok) throw new Error("Erro ao criar assinatura");

      const result = await res.json();

      // Salva os dados e avança imediatamente
      onDataChange({
        subscriptionId: result.subscription.id,
        paymentMethod: "pix",
      });

      toast.success("Assinatura criada com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao configurar assinatura.");
    } finally {
      setLoading(false);
    }
  };

  if (data.subscriptionId !== undefined) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center h-64">
        <CheckCircle className="w-16 h-16 text-green-500 mb-4 animate-bounce" />
        <p className="text-lg font-bold text-green-700 dark:text-green-300">
          Assinatura criada com sucesso!
        </p>
        <p className="text-sm text-muted-foreground">Seu PIX foi gerado.</p>
      </div>
    );
  }

  return (
    <div className="container-padding space-y-6 max-w-lg mx-auto">
      <div className="text-center">
        <h3 className="text-xl font-bold">{t("title")}</h3>
        <p className="text-3xl font-bold text-violet-600 mt-2">
          {formatPrice(price)}
          <span className="text-sm font-normal text-muted-foreground">
            /mês
          </span>
        </p>
      </div>

      <div className="space-y-6">
        {/* Card Informativo do Método (Visual Apenas) */}
        <div className="p-4 border border-violet-100 rounded-xl bg-violet-50/50 dark:bg-violet-900/10 flex items-center gap-4">
          <div className="bg-white dark:bg-violet-900/30 p-3 rounded-full shadow-sm">
            <QrCode className="w-6 h-6 text-violet-600" />
          </div>
          <div className="text-left">
            <h4 className="font-semibold text-violet-900 dark:text-violet-100">
              {tMethod("pix.title")}
            </h4>
            <p className="text-sm text-violet-700/80 dark:text-violet-300/80">
              {tMethod("pix.description")}
            </p>
          </div>
        </div>

        {/* Seletor de Dia de Vencimento */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground justify-center">
            <Calendar className="w-4 h-4" />
            <span>Melhor dia para vencimento:</span>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {[1, 5, 10, 15].map((day) => (
              <Button
                key={day}
                variant={billingDay === day ? "glass" : "outline"}
                onClick={() => setBillingDay(day)}
                className={`h-12 text-lg transition-all ${
                  billingDay === day
                    ? "bg-violet-600 hover:bg-violet-700 text-white shadow-md scale-105"
                    : "hover:border-violet-300 hover:text-violet-600"
                }`}
              >
                {day}
              </Button>
            ))}
          </div>
          <p className="text-xs text-center text-muted-foreground opacity-80 pt-1">
            {t("billingNote") ||
              "A fatura chegará no seu email 2 dias antes do vencimento."}
          </p>
        </div>

        {/* Botão de Ação */}
        <Button
          onClick={handleCreateSubscription}
          disabled={loading}
          className="w-full py-6 text-lg bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-200 dark:shadow-none"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Criando assinatura...
            </>
          ) : (
            "Confirmar"
          )}
        </Button>
      </div>
    </div>
  );
};
