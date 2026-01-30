"use client";

import React from "react";
import { OnboardingStepProps } from "../../OnboardingModal";
import { Text } from "@/components/ui/text";
import { useSession } from "next-auth/react";

export const WelcomeStep: React.FC<OnboardingStepProps> = () => {
  const { data: session } = useSession();
  const firstName = session?.user?.name?.split(" ")[0] || "Estudante";

  return (
    <div className="p-4 md:p-8 flex flex-col items-center justify-center min-h-[50vh] text-center">
      <div className="max-w-xl mx-auto space-y-6">
        <div className="text-4xl md:text-6xl animate-bounce-slow">👋</div>
        
        <Text variant="title" size="3xl" className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Olá, {firstName}!
        </Text>

        <Text size="lg" className="text-gray-600 dark:text-gray-300">
          Seja muito bem-vindo ao <strong>Fluency Lab</strong>.
        </Text>

        <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-800/30 text-sm md:text-base text-blue-800 dark:text-blue-200">
          Vamos configurar seu perfil e contrato rapidinho para você começar suas aulas.
          Leva menos de 3 minutos.
        </div>
      </div>
    </div>
  );
};