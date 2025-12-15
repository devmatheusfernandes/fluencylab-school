// components/onboarding/steps/WelcomeStep.tsx
"use client";

import React from "react";
import { OnboardingStepProps } from "../../OnboardingModal";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { useSession } from "next-auth/react";

export const WelcomeStep: React.FC<OnboardingStepProps> = ({ onNext }) => {
  const { data: session } = useSession();

  const userName = session?.user?.name || "Estudante";
  const firstName = userName.split(" ")[0];

  return (
    <div className="py-2 text-center">
      <div className="max-w-4xl mx-auto">
        {/* Welcome Message */}
        <Text
          size="2xl"
          className="mb-4 font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
        >
          Bem-vindo à FluencyLab, {firstName}! 🎉
        </Text>

        <Text
          size="lg"
          className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed"
        >
          Estamos muito empolgados em tê-lo conosco! Vamos configurar sua conta
          e escolher o plano ideal para sua jornada de aprendizado.
        </Text>

        {/* Next Steps Info */}
        <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 border border-blue-200 dark:border-blue-700">
          <Text className="font-semibold mb-3 text-blue-900 dark:text-blue-100">
            O que vamos fazer agora:
          </Text>
          <div className="text-left space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center text-xs font-bold text-blue-600 dark:text-blue-300">
                1
              </div>
              <Text size="sm">
                Conhecer a plataforma e suas funcionalidades
              </Text>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center text-xs font-bold text-blue-600 dark:text-blue-300">
                2
              </div>
              <Text size="sm">Configurar suas preferências pessoais</Text>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center text-xs font-bold text-blue-600 dark:text-blue-300">
                3
              </div>
              <Text size="sm">Escolher e assinar seu plano de estudos</Text>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center text-xs font-bold text-blue-600 dark:text-blue-300">
                4
              </div>
              <Text size="sm">Começar sua jornada de aprendizado!</Text>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
