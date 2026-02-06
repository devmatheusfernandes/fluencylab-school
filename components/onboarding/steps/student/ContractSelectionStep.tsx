import React from "react";
import { OnboardingStepProps } from "../../OnboardingModal";
import { Check, Star, Zap } from "lucide-react";
import { useTranslations } from "next-intl";

export const ContractSelectionStep: React.FC<OnboardingStepProps> = ({
  data,
  onDataChange,
}) => {
  const t = useTranslations("Onboarding.Student.ContractSelection");
  const tPlans = useTranslations("Onboarding.Student.ContractSelection.Plans");
  const tBenefits = useTranslations(
    "Onboarding.Student.ContractSelection.Benefits",
  );

  const handleSelect = (months: 6 | 12) => {
    onDataChange({ contractLengthMonths: months });
  };

  return (
    <div className="container-padding space-y-6 max-w-4xl mx-auto">
      <div className="text-center space-y-2">
        <h3 className="text-xl font-bold">{t("title")}</h3>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
        {/* Semestral */}
        <div
          onClick={() => handleSelect(6)}
          className={`
            relative p-6 rounded-2xl border-2 cursor-pointer transition-all
            flex flex-col gap-4
            ${
              data.contractLengthMonths === 6
                ? "border-violet-600 bg-violet-50/50 dark:bg-violet-900/10 dark:border-violet-500"
                : "border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-700"
            }
          `}
        >
          <div className="flex justify-between items-start">
            <h4 className="font-semibold text-lg">
              {tPlans("semester.label")}
            </h4>
            {data.contractLengthMonths === 6 && (
              <div className="bg-violet-600 text-white p-1 rounded-full">
                <Check className="w-4 h-4" />
              </div>
            )}
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-bold">R$ 397</div>
            <div className="text-sm text-muted-foreground">{t("perMonth")}</div>
          </div>
        </div>

        {/* Anual */}
        <div
          onClick={() => handleSelect(12)}
          className={`
            relative p-6 rounded-2xl border-2 cursor-pointer transition-all
            flex flex-col gap-4
            ${
              data.contractLengthMonths === 12
                ? "border-violet-600 bg-violet-50/50 dark:bg-violet-900/10 dark:border-violet-500 shadow-lg shadow-violet-100 dark:shadow-none"
                : "border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-700"
            }
          `}
        >
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
            {tPlans("annual.badge")}
          </div>

          <div className="flex justify-between items-start">
            <h4 className="font-semibold text-lg">{tPlans("annual.label")}</h4>
            {data.contractLengthMonths === 12 && (
              <div className="bg-violet-600 text-white p-1 rounded-full">
                <Check className="w-4 h-4" />
              </div>
            )}
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-bold">R$ 337</div>
            <div className="text-sm text-muted-foreground">{t("perMonth")}</div>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 mt-4">
        <ul className="space-y-3">
          <li className="flex items-center gap-2 text-sm">
            <Zap className="w-4 h-4 text-amber-500" />
            {tBenefits("material")}
          </li>
          <li className="flex items-center gap-2 text-sm">
            <Star className="w-4 h-4 text-violet-500" />
            {tBenefits("customClasses")}
          </li>
          <li className="flex items-center gap-2 text-sm">
            <Check className="w-4 h-4 text-green-500" />
            {tBenefits("proficiency")}
          </li>
        </ul>
      </div>
    </div>
  );
};
