"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { QRCodeSVG } from "qrcode.react";
import { useSettings } from "@/hooks/core/useSettings";
import { Spinner } from "../ui/spinner";
import { useTranslations } from "next-intl";
import { Lock, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

export default function TwoFactorSetup() {
  const t = useTranslations("Settings.twoFactor");
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
        throw new Error(data.error || t("errors.setupFailed"));
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
      setError(t("errors.invalidCode"));
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
        throw new Error(data.error || t("errors.verifyFailed"));
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
      setError(t("errors.invalid2FA"));
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
        throw new Error(data.error || t("errors.disableFailed"));
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
      <Card className="card-base p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <Text variant="subtitle" size="lg" weight="semibold">
              {t("setupTitle")}
            </Text>
            <Spinner />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="card-base p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <ShieldCheck className="h-5 w-5 text-primary" />
        </div>
        <div>
          <Text variant="subtitle" size="lg" weight="semibold">
            {t("setupTitle")}
          </Text>
          <Text size="sm" variant="placeholder">
            {t("setupSubtitle")}
          </Text>
        </div>
      </div>

      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <Text size="sm" className="text-destructive">
              {error}
            </Text>
          </div>
        )}

        {!isSetupComplete ? (
          <div className="space-y-4">
            <motion.div 
              className="flex items-center justify-between p-4 rounded-lg item-base"
              whileHover={{ scale: 1.01 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <div className="flex items-center gap-3">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Text weight="medium">{t("status")}</Text>
                  <Text size="sm" variant="placeholder">
                    {t("disabledMessage")}
                  </Text>
                </div>
              </div>
              <Button
                onClick={handleEnableTwoFactor}
                disabled={isEnabling || isLoading}
              >
                {isEnabling ? <Spinner /> : t("enableButton")}
              </Button>
            </motion.div>

            {qrCodeUrl && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-6 border border-card/80 rounded-lg bg-card/20"
              >
                <Text weight="medium" className="mb-4">
                  {t("qrCodeInstruction")}
                </Text>
                <div className="p-4 bg-white rounded-lg flex justify-center my-4 w-fit mx-auto">
                  <QRCodeSVG value={qrCodeUrl} size={200} />
                </div>
                <Text
                  size="sm"
                  variant="placeholder"
                  className="text-center mt-4 block"
                >
                  {t("manualKeyInstruction")}{" "}
                  <span className="font-mono font-semibold text-secondary">
                    {secret}
                  </span>
                </Text>

                <div className="justify-center items-center flex flex-col mt-6 max-w-xs mx-auto">
                  <label
                    htmlFor="verificationCode"
                    className="block text-sm font-medium mb-2"
                  >
                    {t("codeInstruction")}
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
                    className="w-full text-center tracking-widest text-lg"
                  />
                  <div className="mt-4 w-full">
                    <Button
                      onClick={handleVerifyCode}
                      disabled={isVerifying || verificationCode.length !== 6}
                      className="w-full"
                    >
                      {isVerifying ? <Spinner /> : t("verifyButton")}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <motion.div 
              className="flex items-center justify-between p-4 rounded-lg item-base"
              whileHover={{ scale: 1.01 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <div>
                  <Text weight="medium">{t("status")}</Text>
                  <Text size="sm" variant="placeholder">
                    {t("enabledMessage")}
                  </Text>
                </div>
              </div>
              <Button
                onClick={handleDisableTwoFactor}
                disabled={isLoading}
                variant="destructive"
              >
                {t("disableButton")}
              </Button>
            </motion.div>

            {backupCodes.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 border border-yellow-200 rounded-lg bg-yellow-50 dark:bg-yellow-900/10 dark:border-yellow-900/30"
              >
                <Text weight="medium" className="mb-2 text-yellow-800 dark:text-yellow-500">
                  {t("backupCodesTitle")}
                </Text>
                <Text size="sm" className="mb-3 text-yellow-700 dark:text-yellow-400">
                  {t("backupCodesInstruction")}
                </Text>
                <div className="grid grid-cols-2 gap-2">
                  {backupCodes.map((code, index) => (
                    <div
                      key={index}
                      className="font-mono text-sm p-2 bg-white/50 dark:bg-black/20 rounded text-center select-all"
                    >
                      {code}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
