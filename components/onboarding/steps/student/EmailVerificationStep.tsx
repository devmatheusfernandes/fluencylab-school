"use client";

import React, { useState, useEffect, useCallback } from "react";
import { OnboardingStepProps } from "../../OnboardingModal";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Mail, RefreshCw, CheckCircle2, ShieldAlert } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

export const EmailVerificationStep: React.FC<OnboardingStepProps> = ({
  data,
  onDataChange,
  onNext
}) => {
  const { data: session } = useSession();
  const [status, setStatus] = useState<"checking" | "verified" | "unverified">("checking");
  const [loading, setLoading] = useState(false);

  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/verify-status");
      if (res.ok) {
        const json = await res.json();
        const isVerified = json.emailVerified;
        setStatus(isVerified ? "verified" : "unverified");
        onDataChange({ emailVerified: isVerified });
        if(isVerified && !data.emailVerified) toast.success("Email confirmado!");
      }
    } catch {
      setStatus("unverified");
    }
  }, [onDataChange, data.emailVerified]);

  useEffect(() => { checkStatus(); }, [checkStatus]);

  // Se verificado, avança automaticamente após delay curto
  useEffect(() => {
    if (status === "verified") {
        const timer = setTimeout(() => onNext(), 1500);
        return () => clearTimeout(timer);
    }
  }, [status, onNext]);

  const resendEmail = async () => {
    setLoading(true);
    try {
      await fetch("/api/auth/resend-verification", { method: "POST" });
      toast.success("Link enviado! Cheque sua caixa de entrada.");
    } catch {
      toast.error("Erro ao enviar.");
    } finally {
      setLoading(false);
    }
  };

  if (status === "checking") return <div className="p-8 text-center"><Spinner /></div>;

  return (
    <div className="p-4 md:p-8 max-w-xl mx-auto text-center">
      {status === "verified" ? (
        <Card className="p-8 border-green-200 bg-green-50 dark:bg-green-900/10">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <Text variant="title" className="text-green-800 dark:text-green-200">Email Verificado!</Text>
          <Text size="sm" className="mt-2 text-green-700">Redirecionando...</Text>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8 text-yellow-600" />
          </div>
          
          <div>
            <Text variant="title">Confirme seu Email</Text>
            <Text className="text-gray-500 mt-2">
              Enviamos um link para <strong>{session?.user?.email}</strong>.
              <br className="hidden md:block"/> Precisamos confirmar sua segurança.
            </Text>
          </div>

          <div className="flex flex-col gap-3">
            <Button onClick={checkStatus} variant="outline" className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" /> Já cliquei no link
            </Button>
            <Button onClick={resendEmail} disabled={loading} variant="ghost" className="w-full text-sm">
              <Mail className="w-4 h-4 mr-2" /> Reenviar email
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};