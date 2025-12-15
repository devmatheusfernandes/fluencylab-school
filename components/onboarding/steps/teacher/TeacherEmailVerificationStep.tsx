// components/onboarding/steps/teacher/TeacherEmailVerificationStep.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { TeacherOnboardingStepProps } from "../../TeacherOnboardingModal";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";

import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  CheckCircle2,
  Link,
  Mail,
  Bell,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  GraduationCap,
  UserCheck,
  Square,
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

export const TeacherEmailVerificationStep: React.FC<
  TeacherOnboardingStepProps
> = ({ data, onDataChange, onNext, isLoading: parentLoading }) => {
  const { data: session } = useSession();
  const [verificationStatus, setVerificationStatus] = useState<
    "checking" | "verified" | "unverified"
  >("checking");
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const checkVerificationStatus = useCallback(async () => {
    try {
      setVerificationStatus("checking");

      const response = await fetch("/api/auth/check-verification");

      if (!response.ok) {
        console.error(`HTTP error! status: ${response.status}`);
        setVerificationStatus("unverified");
        onDataChange({ emailVerified: false });
        return;
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error("Response is not JSON");
        setVerificationStatus("unverified");
        onDataChange({ emailVerified: false });
        return;
      }

      const result = await response.json();

      if (result.verified || result.emailVerified) {
        setVerificationStatus("verified");
        onDataChange({ emailVerified: true });
      } else {
        setVerificationStatus("unverified");
        onDataChange({ emailVerified: false });
      }
    } catch (error) {
      console.error("Error checking verification status:", error);
      setVerificationStatus("unverified");
      onDataChange({ emailVerified: false });
    }
  }, [onDataChange]);
  // Check verification status on mount
  useEffect(() => {
    checkVerificationStatus();
  }, [checkVerificationStatus]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const resendVerificationEmail = async () => {
    try {
      setIsResending(true);

      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
      });

      if (response.ok) {
        // Try to parse JSON response for success message
        try {
          const result = await response.json();
          toast.success(
            result.message ||
              "Email de verificação reenviado! Verifique sua caixa de entrada."
          );
        } catch {
          // If JSON parsing fails, show default success message
          toast.success(
            "Email de verificação reenviado! Verifique sua caixa de entrada."
          );
        }
        setCooldown(60); // 60 seconds cooldown
      } else {
        // Try to get error message from response
        try {
          const errorResult = await response.json();
          toast.error(
            errorResult.error ||
              errorResult.message ||
              "Erro ao reenviar email de verificação."
          );
        } catch {
          // If JSON parsing fails, show default error message
          toast.error(
            `Erro ao reenviar email de verificação. Status: ${response.status}`
          );
        }
      }
    } catch (error) {
      console.error("Error resending verification email:", error);
      toast.error("Erro ao reenviar email de verificação.");
    } finally {
      setIsResending(false);
    }
  };

  const firstName = session?.user?.name?.split(" ")[0] || "Professor";

  if (verificationStatus === "checking") {
    return (
      <div className="flex-1 px-8 py-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto text-center">
          <Spinner className="mb-4" />
          <Text className="text-lg text-gray-600 dark:text-gray-300">
            Verificando status do seu email...
          </Text>
        </div>
      </div>
    );
  }

  if (verificationStatus === "verified") {
    return (
      <div className="flex-1 px-8 py-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">✅</div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Email Verificado com Sucesso!
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Perfeito, {firstName}! Seu email está verificado e você pode
              continuar configurando seu perfil de professor.
            </p>
          </div>

          <Card className="p-6 card-base bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700">
            <div className="flex items-start gap-4">
              <ShieldCheck className="w-8 h-8 text-green-600 dark:text-green-400 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                  Conta de Professor Verificada
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <Text className="text-green-700 dark:text-green-300 text-sm">
                      Email: {session?.user?.email}
                    </Text>
                  </div>
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <Text className="text-green-700 dark:text-green-300 text-sm">
                      Perfil: Professor verificado
                    </Text>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <Text className="text-green-700 dark:text-green-300 text-sm">
                      Status: Pronto para configurar informações bancárias
                    </Text>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <Card className="p-6 card-base text-center">
              <div className="text-3xl mb-3">🏦</div>
              <h4 className="font-semibold mb-2">Próximo Passo</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Configure suas informações bancárias para receber pagamentos
              </p>
            </Card>
            <Card className="p-6 card-base text-center">
              <div className="text-3xl mb-3">📅</div>
              <h4 className="font-semibold mb-2">Depois</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Defina seus horários regulares de disponibilidade
              </p>
            </Card>
            <Card className="p-6 card-base text-center">
              <div className="text-3xl mb-3">🚀</div>
              <h4 className="font-semibold mb-2">Finalizar</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Comece a ensinar na plataforma
              </p>
            </Card>
          </div>

          <div className="flex justify-center mt-8">
            <Button
              onClick={onNext}
              disabled={parentLoading}
              className="flex items-center gap-2 px-8 py-3"
            >
              Continuar para informações bancárias
              <Link className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Unverified state
  return (
    <div className="flex-1 px-8 py-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">📧</div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Verificação de Email Necessária
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Para garantir a segurança da plataforma e dos alunos, precisamos
            verificar seu email antes de continuar com a configuração do seu
            perfil de professor.
          </p>
        </div>

        <div className="space-y-6">
          <Card className="p-6 card-base">
            <div className="flex items-start gap-4">
              <ShieldAlert className="w-6 h-6 text-yellow-600 dark:text-yellow-300 mt-1" />
              <div className="flex-1">
                <Text className="text-yellow-800 dark:text-yellow-200 font-medium mb-2">
                  Email não verificado
                </Text>
                <Text className="text-yellow-700 dark:text-yellow-300 text-sm mb-4">
                  Enviamos um email de verificação para{" "}
                  <span className="font-medium">{session?.user?.email}</span>.
                  Por favor, verifique sua caixa de entrada e clique no link de
                  verificação.
                </Text>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="outline"
                    onClick={checkVerificationStatus}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Verificar novamente
                  </Button>
                  <Button
                    variant="outline"
                    onClick={resendVerificationEmail}
                    disabled={isResending || cooldown > 0}
                    className="flex items-center gap-2"
                  >
                    <Mail className="w-4 h-4" />
                    {cooldown > 0
                      ? `Reenviar em ${cooldown}s`
                      : "Reenviar email"}
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 card-base bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700">
            <div className="flex items-start gap-4">
              <Bell className="w-6 h-6 text-blue-600 dark:text-blue-400 mt-1" />
              <div>
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  Não recebeu o email?
                </h4>
                <ul className="text-blue-800 dark:text-blue-200 text-sm space-y-1">
                  <li>• Verifique sua pasta de spam ou lixo eletrônico</li>
                  <li>
                    • Aguarde alguns minutos, emails podem demorar para chegar
                  </li>
                  <li>
                    • Certifique-se de que o email {session?.user?.email} está
                    correto
                  </li>
                  <li>• Use o botão Reenviar email se necessário</li>
                </ul>
              </div>
            </div>
          </Card>

          <Card className="p-6 card-base bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700">
            <div className="flex items-start gap-4">
              <Square className="w-6 h-6 text-green-600 dark:text-green-400 mt-1" />
              <div>
                <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                  Por que verificamos o email de professores?
                </h4>
                <p className="text-green-700 dark:text-green-300 text-sm leading-relaxed">
                  A verificação de email é essencial para professores pois
                  garante que você receberá notificações importantes sobre
                  aulas, pagamentos e comunicações com alunos. Também é uma
                  medida de segurança para proteger a comunidade da plataforma.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
