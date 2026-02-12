import React from "react";
import { OnboardingStepProps } from "../../OnboardingModal";
import { Clock, CalendarX, Wallet, AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";

export const BestPracticesStep: React.FC<OnboardingStepProps> = () => {
  const t = useTranslations("Onboarding.Student.BestPractices");
  const tRules = useTranslations("Onboarding.Student.BestPractices.Rules");

  const rules = [
    {
      icon: Clock,
      title: tRules("punctuality.title"),
      text: tRules("punctuality.text"),
      color: "text-blue-500",
      bg: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      icon: CalendarX,
      title: tRules("rescheduling.title"),
      text: tRules("rescheduling.text"),
      color: "text-amber-500",
      bg: "bg-amber-50 dark:bg-amber-900/20",
    },
    {
      icon: Wallet,
      title: tRules("financial.title"),
      text: tRules("financial.text"),
      color: "text-green-500",
      bg: "bg-green-50 dark:bg-green-900/20",
    },
    {
      icon: AlertTriangle,
      title: tRules("cancellation.title"),
      text: tRules("cancellation.text"),
      color: "text-rose-500",
      bg: "bg-rose-50 dark:bg-rose-900/20",
    },
  ];

  return (
    <div className="container-padding space-y-6 max-w-2xl mx-auto">
      <div className="text-center space-y-2">
        <h3 className="text-xl font-bold">{t("title")}</h3>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="grid gap-4 max-h-[calc(70vh-300px)] overflow-auto">
        {rules.map((rule, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-4 p-4 rounded-xl border ${rule.bg} border-transparent`}
          >
            <div
              className={`p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm ${rule.color}`}
            >
              <rule.icon className="w-5 h-5" />
            </div>
            <div>
              <h4 className={`font-semibold ${rule.color}`}>{rule.title}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {rule.text}
              </p>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-center text-muted-foreground pt-2">
        {t("agreement")}
      </p>
    </div>
  );
};
