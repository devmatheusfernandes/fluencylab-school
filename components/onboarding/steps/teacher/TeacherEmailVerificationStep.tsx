"use client";

import React, { useState, useEffect, useCallback } from "react";
import { TeacherOnboardingStepProps } from "../../TeacherOnboardingModal";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Mail, RefreshCw, CheckCircle2 } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

export const TeacherEmailVerificationStep: React.FC<
  TeacherOnboardingStepProps
> = ({ data, onDataChange, onNext }) => {
  const { data: session } = useSession();
  const [status, setStatus] = useState<"checking" | "verified" | "unverified">(
    "checking",
  );
  const [loading, setLoading] = useState(false);

  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/verify-status"); // Endpoint unificado sugerido
      if (res.ok) {
        const json = await res.json();
        const isVerified = json.emailVerified;
        setStatus(isVerified ? "verified" : "unverified");
        onDataChange({ emailVerified: isVerified });

        if (isVerified && !data.emailVerified) {
          toast.success("Email verificado com sucesso!");
          setTimeout(() => onNext(), 1500);
        }
      }
    } catch {
      setStatus("unverified");
    }
  }, [onDataChange, data.emailVerified, onNext]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const resendEmail = async () => {
    setLoading(true);
    try {
      await fetch("/api/auth/resend-verification", { method: "POST" });
      toast.success("Link enviado! Verifique sua caixa de entrada.");
    } catch {
      toast.error("Erro ao enviar email.");
    } finally {
      setLoading(false);
    }
  };

  if (status === "checking")
    return (
      <div className="p-8 text-center">
        <Spinner />
      </div>
    );

  return (
    <div className="p-4 md:p-8 max-w-xl mx-auto text-center">
      {status === "verified" ? (
        <Card className="p-8 bg-green-50 dark:bg-green-900/10 border-green-200">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <Text variant="title" className="text-green-800 dark:text-green-200">
            Email Verificado!
          </Text>
          <Text size="sm" className="text-green-600 mt-2">
            Redirecionando...
          </Text>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto">
            <Mail className="w-8 h-8 text-blue-600" />
          </div>

          <div>
            <Text variant="title">Verifique seu Email</Text>
            <Text className="text-gray-500 mt-2">
              Para ativar sua conta de professor, precisamos confirmar o email:{" "}
              <br />
              <strong>{session?.user?.email}</strong>
            </Text>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              onClick={resendEmail}
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              <Mail className="w-4 h-4 mr-2" /> Reenviar link de verificação
            </Button>
            <Button
              onClick={checkStatus}
              variant="ghost"
              className="w-full text-sm"
            >
              <RefreshCw className="w-4 h-4 mr-2" /> Já cliquei no link
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
