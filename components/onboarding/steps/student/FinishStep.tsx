"use client";

import React from "react";
import { OnboardingStepProps } from "../../OnboardingModal";
import { Text } from "@/components/ui/text";
import { PartyPopper } from "lucide-react";

export const FinishStep: React.FC<OnboardingStepProps> = () => {
  return (
    <div className="p-8 text-center flex flex-col items-center justify-center h-full min-h-[40vh]">
      <div className="w-20 h-20 bg-gradient-to-tr from-yellow-300 to-orange-500 rounded-full flex items-center justify-center mb-6 animate-pulse">
        <PartyPopper className="w-10 h-10 text-white" />
      </div>

      <Text variant="title" size="3xl" className="mb-4">
        Parabéns!
      </Text>

      <Text size="lg" className="text-gray-600 dark:text-gray-300 max-w-md mx-auto mb-8">
        Sua conta está configurada. Seu professor entrará em contato em breve para a primeira aula.
      </Text>

      <div className="text-sm text-gray-400">
        Dúvidas? <span className="underline cursor-pointer">Fale com o suporte</span>
      </div>
    </div>
  );
};