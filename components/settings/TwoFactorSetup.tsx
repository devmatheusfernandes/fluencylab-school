"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { QRCodeSVG } from "qrcode.react";
import { useSettings } from "@/hooks/useSettings";
import { Spinner } from "../ui/spinner";

export default function TwoFactorSetup() {
  const { data: session, update } = useSession();
  const { isLoading } = useSettings();
  const [isEnabling, setIsEnabling] = useState(false);
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check if 2FA is already enabled
  useEffect(() => {
    const checkTwoFactorStatus = async () => {
      if (session?.user?.id) {
        try {
          const response = await fetch(`/api/users/me`);
          const userData = await response.json();

          if (response.ok && userData.twoFactorEnabled) {
            setIsSetupComplete(true);
          }
        } catch (err) {
          console.error("Failed to check 2FA status:", err);
        } finally {
          setLoading(false);
        }
      }
    };

    checkTwoFactorStatus();
  }, [session]);

  const handleEnableTwoFactor = async () => {
    setIsEnabling(true);
    setError("");

    try {
      const response = await fetch("/api/auth/2fa/setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: session?.user?.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Falha ao configurar");
      }

      setQrCodeUrl(data.qrCodeUrl);
      setSecret(data.secret);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsEnabling(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError("Digite um código válido");
      return;
    }

    setIsVerifying(true);
    setError("");

    try {
      const response = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: session?.user?.id,
          secret,
          token: verificationCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Falha ao verificar código");
      }

      setIsSetupComplete(true);
      setBackupCodes(data.backupCodes);

      // Update the session to reflect 2FA status
      await update({
        ...session,
        user: {
          ...session?.user,
          twoFactorEnabled: true,
        },
      });
    } catch (err: any) {
      setError("Código 2FA inválido");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDisableTwoFactor = async () => {
    try {
      const response = await fetch("/api/auth/2fa/disable", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: session?.user?.id,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Falha ao desativar");
      }

      setIsSetupComplete(false);
      setQrCodeUrl("");
      setSecret("");
      setVerificationCode("");
      setBackupCodes([]);

      // Update the session to reflect 2FA status
      await update({
        ...session,
        user: {
          ...session?.user,
          twoFactorEnabled: false,
        },
      });
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <Card className="space-y-6">
        <section>
          <Text variant="subtitle" size="lg" weight="semibold">
            Autenticação
          </Text>
          <Spinner />
        </section>
      </Card>
    );
  }

  return (
    <Card className="space-y-6">
      <section>
        <Text variant="subtitle" size="lg" weight="semibold">
          Autenticação em Dois Fatores
        </Text>
        <Text size="sm" variant="placeholder" className="mt-1">
          Adicione uma camada extra de segurança à sua conta
        </Text>

        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-200 rounded-lg">
            <Text size="sm" className="text-red-800">
              {error}
            </Text>
          </div>
        )}

        {!isSetupComplete ? (
          <div className="mt-4 space-y-4">
            <div className="flex flex-row items-start justify-between">
              <div>
                <Text weight="medium">Status</Text>
                <Text size="sm" variant="placeholder">
                  A autenticação em dois fatores está desativada
                </Text>
              </div>
              <Button
                onClick={handleEnableTwoFactor}
                disabled={isEnabling || isLoading}
                variant="default"
              >
                {isEnabling ? <Spinner /> : "Ativar"}
              </Button>
            </div>

            {qrCodeUrl && (
              <div className="mt-6 p-6 border border-card/80 rounded-lg bg-card/20">
                <Text weight="medium" className="mb-4">
                  Escaneie este código QR com seu aplicativo de autenticação
                </Text>
                <div className="p-4 bg-white rounded-lg flex justify-center my-4">
                  <QRCodeSVG value={qrCodeUrl} size={200} />
                </div>
                <Text
                  size="sm"
                  variant="placeholder"
                  className="text-center mt-4"
                >
                  Se você não puder escanear o código QR, insira esta chave
                  secreta manualmente:{" "}
                  <span className="font-mono font-semibold text-secondary">
                    {secret}
                  </span>
                </Text>

                <div className="justify-center items-center flex flex-col mt-6">
                  <label
                    htmlFor="verificationCode"
                    className="block text-sm font-medium mb-2"
                  >
                    Insira o código de 6 dígitos do seu aplicativo de
                    autenticação
                  </label>
                  <Input
                    id="verificationCode"
                    type="text"
                    value={verificationCode}
                    onChange={(e) =>
                      setVerificationCode(
                        e.target.value.replace(/\D/g, "").slice(0, 6)
                      )
                    }
                    placeholder="000000"
                    maxLength={6}
                    className="w-full"
                  />
                  <div className="mt-4">
                    <Button
                      onClick={handleVerifyCode}
                      disabled={isVerifying || verificationCode.length !== 6}
                    >
                      {isVerifying ? <Spinner /> : "Verificar"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Text weight="medium">Status</Text>
                <Text size="sm" variant="placeholder">
                  Two-factor authentication is enabled
                </Text>
              </div>
              <Button
                onClick={handleDisableTwoFactor}
                disabled={isLoading}
                variant="destructive"
              >
                Disable
              </Button>
            </div>

            {backupCodes.length > 0 && (
              <div className="mt-6 p-4 border border-yellow-200 rounded-lg bg-yellow-50">
                <Text weight="medium" className="mb-2">
                  Backup Codes
                </Text>
                <Text size="sm" className="mb-3">
                  Store these backup codes in a secure location. You can use
                  each code only once.
                </Text>
                <div className="grid grid-cols-2 gap-2">
                  {backupCodes.map((code, index) => (
                    <div
                      key={index}
                      className="font-mono text-sm p-2 bg-surface-1 rounded"
                    >
                      {code}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </Card>
  );
}
