import React from "react";
import { useSession } from "next-auth/react";
import { OnboardingStepProps } from "../../OnboardingModal";
import { useTranslations } from "next-intl";

export const WelcomeStep: React.FC<OnboardingStepProps> = () => {
  const { data: session } = useSession();
  const t = useTranslations("Onboarding.Student.Welcome");
  
  const firstName = session?.user?.name?.split(" ")[0] || t("defaultName");

  return (
    <div className="p-4 md:p-8 flex flex-col items-center justify-center min-h-[50vh] text-center">
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-5xl md:text-6xl animate-bounce-slow">👋</div>

        <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
          {t("greeting", { name: firstName })}
        </h1>

        <p className="text-lg text-gray-600 dark:text-gray-300" dangerouslySetInnerHTML={{ __html: t.raw("welcomeMessage") }} />

        <div className="bg-violet-50 dark:bg-violet-900/10 p-4 rounded-xl border border-violet-100 dark:border-violet-800/30 text-sm text-violet-800 dark:text-violet-200">
          {t("description")}
        </div>
      </div>
    </div>
  );
};
