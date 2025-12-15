// components/onboarding/steps/EmailVerificationStep.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { OnboardingStepProps } from "../../OnboardingModal";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";

import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import {
  MailCheck,
  MailWarning,
  CheckCircle2,
  ShieldCheck,
  Bell,
  ShieldAlert,
  Link,
  RefreshCw,
  Mail,
} from "lucide-react";

export const EmailVerificationStep: React.FC<OnboardingStepProps> = ({
  data,
  onDataChange,
  onNext,
  isLoading: parentLoading,
}) => {
  const { data: session } = useSession();
  const [verificationStatus, setVerificationStatus] = useState<
    "checking" | "verified" | "unverified"
  >("checking");
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const checkVerificationStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/verify-status");

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

      setVerificationStatus(result.emailVerified ? "verified" : "unverified");
      onDataChange({ emailVerified: result.emailVerified });
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
    if (cooldown > 0) return;

    setIsResending(true);
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
      });

      if (response.ok) {
        // Try to parse JSON response for success message
        try {
          const result = await response.json();
          toast.success(result.message || "Email de verificação reenviado!");
        } catch {
          // If JSON parsing fails, show default success message
          toast.success("Email de verificação reenviado!");
        }
        setCooldown(60); // 60 seconds cooldown
      } else {
        // Try to get error message from response
        try {
          const errorResult = await response.json();
          toast.error(
            errorResult.error ||
              errorResult.message ||
              "Erro ao reenviar email de verificação"
          );
        } catch {
          // If JSON parsing fails, show default error message
          toast.error(
            `Erro ao reenviar email de verificação. Status: ${response.status}`
          );
        }
      }
    } catch (error) {
      console.error("Error resending verification:", error);
      toast.error("Erro ao reenviar email de verificação");
    } finally {
      setIsResending(false);
    }
  };

  if (verificationStatus === "checking") {
    return (
      <div className="p-8 flex gap-2 items-center justify-center">
        <div className="text-center">
          <Spinner />
          <Text>Verificando status do email...</Text>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div
            className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
              verificationStatus === "verified"
                ? "bg-green-100 dark:bg-green-800"
                : "bg-yellow-100 dark:bg-yellow-800"
            }`}
          >
            {verificationStatus === "verified" ? (
              <MailCheck className="w-8 h-8 text-green-600 dark:text-green-300" />
            ) : (
              <MailWarning className="w-8 h-8 text-yellow-600 dark:text-yellow-300" />
            )}
          </div>

          <Text variant="title">
            {verificationStatus === "verified"
              ? "Email Verificado!"
              : "Verificação de Email"}
          </Text>

          <Text size="lg" className="text-gray-600 dark:text-gray-300">
            {verificationStatus === "verified"
              ? "Seu email foi verificado com sucesso."
              : "Para garantir a segurança da sua conta, recomendamos verificar seu email."}
          </Text>
        </div>

        {verificationStatus === "verified" ? (
          /* Email Verified Content */
          <Card className="p-6 card-base">
            <div className="text-center">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <Text
                size="lg"
                className="text-green-800 dark:text-green-100 mb-2"
              >
                Tudo certo!
              </Text>
              <Text className="text-green-700 dark:text-green-200 mb-6">
                Seu email <strong>{session?.user?.email}</strong> foi verificado
                com sucesso. Você receberá todas as notificações importantes
                sobre suas aulas e pagamentos.
              </Text>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-3 p-3 bg-white dark:bg-green-800/50 rounded-lg">
                  <ShieldCheck className="w-5 h-5 text-green-600 dark:text-green-300" />
                  <Text size="sm">Conta protegida</Text>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white dark:bg-green-800/50 rounded-lg">
                  <Bell className="w-5 h-5 text-green-600 dark:text-green-300" />
                  <Text size="sm">Notificações ativas</Text>
                </div>
              </div>
            </div>
          </Card>
        ) : (
          /* Email Not Verified Content */
          <div className="space-y-6">
            <Card className="p-6 card-base">
              <div className="flex items-start gap-4">
                <ShieldAlert className="w-6 h-6 text-yellow-600 dark:text-yellow-300 mt-1" />
                <div className="flex-1">
                  <Text
                    size="lg"
                    className="text-yellow-800 dark:text-yellow-100 mb-2"
                  >
                    Email não verificado
                  </Text>
                  <Text className="text-yellow-700 dark:text-yellow-200 mb-4">
                    Enviamos um link de verificação para{" "}
                    <strong>{session?.user?.email}</strong>. Verifique sua caixa
                    de entrada e clique no link para confirmar seu email.
                  </Text>

                  <div className="space-y-3">
                    <Button
                      onClick={resendVerificationEmail}
                      disabled={isResending || cooldown > 0}
                      className="w-full sm:w-auto"
                      isLoading={isResending}
                    >
                      {cooldown > 0 ? (
                        `Reenviar em ${cooldown}s`
                      ) : (
                        <>
                          <Mail className="w-4 h-4 mr-2" />
                          Reenviar email de verificação
                        </>
                      )}
                    </Button>

                    <Button
                      onClick={checkVerificationStatus}
                      variant="ghost"
                      className="w-full sm:w-auto ml-0 sm:ml-3"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Já verifiquei, atualizar status
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Why Verify Section */}
            <Card className="p-6">
              <Text variant="title" className="mb-4">
                Por que verificar seu email?
              </Text>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Link className="w-5 h-5 text-blue-500" />
                  <Text>Maior segurança para sua conta</Text>
                </div>
                <div className="flex items-center gap-3">
                  <Link className="w-5 h-5 text-green-500" />
                  <Text>
                    Receber lembretes de aulas e notificações importantes
                  </Text>
                </div>
                <div className="flex items-center gap-3">
                  <Link className="w-5 h-5 text-purple-500" />
                  <Text>Recuperação de conta em caso de problemas</Text>
                </div>
              </div>
            </Card>

            {/* Verification Required Message */}
            <div className="text-center">
              <Card className="p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700">
                <Text className="text-blue-800 dark:text-blue-100 font-medium">
                  ⚠️ A verificação do email é obrigatória para continuar
                </Text>
                <Text
                  size="sm"
                  className="text-blue-700 dark:text-blue-200 mt-2"
                >
                  Por favor, verifique seu email para prosseguir com o cadastro
                </Text>
              </Card>
            </div>

            <div className="text-center">
              <Text size="sm" className="text-gray-500 dark:text-gray-400">
                💡 Não encontrou o email? Verifique sua pasta de spam ou lixo
                eletrônico.
              </Text>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
