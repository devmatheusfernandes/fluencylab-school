import React from "react";
import { OnboardingStepProps } from "../../OnboardingModal";
import { Check, Rocket } from "lucide-react";
import { useTranslations } from "next-intl";

export const FinishStep: React.FC<OnboardingStepProps> = () => {
  const t = useTranslations("Onboarding.Student.Finish");

  return (
    <div className="p-8 text-center flex flex-col items-center justify-center min-h-[50vh]">
      <div className="w-20 h-20 bg-gradient-to-tr from-green-400 to-blue-500 rounded-full flex items-center justify-center mb-6 animate-pulse">
        <Check className="w-10 h-10 text-white" />
      </div>

      <h1 className="text-3xl font-bold mb-4">{t("title")}</h1>

      <p className="text-lg text-gray-600 dark:text-gray-300 max-w-md mx-auto mb-8">
        {t("description")}
      </p>

      <div className="text-sm text-gray-400">
        {t.rich("support", {
          link: (chunks) => (
            <a href="#" className="underline hover:text-violet-500">
              {chunks}
            </a>
          ),
        })}
      </div>
    </div>
  );
};
