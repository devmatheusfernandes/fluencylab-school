"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { NextIntlClientProvider, useLocale } from "next-intl";
import BackgroundLogin from "@/public/images/login/background";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BackButton } from "@/components/ui/back-button";
import LanguageSwitcher from "@/components/LanguageSwitcher";

type Messages = Record<string, Record<string, string>>;

interface TwoFactorClientProps {
  messages: Messages;
}

function LoadingFallback({ t }: { t: Record<string, string> }) {
  return (
    <div className="max-w-md mx-auto w-full">
      <div className="text-center">
        <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2">
          {t.twoFactorLoadingTitle || "Loading..."}
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          {t.twoFactorLoadingSubtitle || "Preparing two-factor verification"}
        </p>
      </div>
    </div>
  );
}

export function TwoFactorClient({ messages }: TwoFactorClientProps) {
  const [code, setCode] = React.useState("");
  const [error, setError] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();

  const callbackUrl = searchParams.get("callbackUrl") || "/hub";

  React.useEffect(() => {
    try {
      const fallbackData = sessionStorage.getItem("temp-2fa-data");
      if (fallbackData) {
        const parsed = JSON.parse(fallbackData) as {
          email: string;
          password: string;
          timestamp: number;
        };
        const isExpired = Date.now() - parsed.timestamp > 10 * 60 * 1000;
        if (!isExpired) {
          setEmail(parsed.email);
          setPassword(parsed.password);
          return;
        } else {
          sessionStorage.removeItem("temp-2fa-data");
        }
      }
      // Se não encontrou dados, mantemos a página e deixamos o usuário voltar ao login
    } catch (fallbackError) {
      console.error("Erro ao ler storage 2FA:", fallbackError);
    }
  }, []);

  const t = (messages?.Auth as Record<string, string>) ?? {};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!email || !password) {
      setError(t.internalError || "Authentication data not found. Please sign in again.");
      setIsLoading(false);
      return;
    }

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
        twoFactorCode: code,
      });

      if (result?.error) {
        if (result.error === "Invalid 2FA code") {
          setError(t.twoFactorInvalid || "Invalid 2FA code. Try again.");
        } else if (result.error === "2FA_REQUIRED") {
          setError(t.twoFactorRequired || "2FA code is required. Enter the code.");
        } else if (result.error === "CredentialsSignin") {
          setError(t.invalidCredentials || "Authentication error. Check your credentials.");
        } else if (result.error.includes("401")) {
          setError(t.unauthorized || "Unauthorized. Please sign in again.");
        } else {
          setError(t.internalError || `Error: ${result.error}`);
        }
      } else if (result?.ok) {
        try {
          sessionStorage.removeItem("temp-2fa-data");
        } catch {}
        router.push(callbackUrl);
        router.refresh();
      } else {
        setError(t.internalError || "Invalid server response. Try again.");
      }
    } catch (err: any) {
      console.error("2FA verification error:", err);
      setError(t.internalError || "Unexpected error. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <div className="min-h-dvh w-full bg-background dark:bg-gray-950 flex items-center justify-center p-4 sm:p-6 relative">
        <BackButton
          href={`/${locale}`}
          ariaLabel={t.backAriaLabel}
          className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10"
        />
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10 flex gap-2">
          <LanguageSwitcher />
        </div>

        <div className="w-full max-w-5xl bg-white/60 dark:bg-gray-900 rounded-xl shadow-2xl overflow-hidden">
          <div className="flex flex-col lg:flex-row">
            <div className="hidden lg:flex flex-col items-center justify-center lg:w-1/2 bg-gray-100 dark:bg-gray-800 p-8 lg:p-12 relative min-h-[300px] lg:min-h-[600px]">
              <BackgroundLogin />
            </div>

            <div className="w-full lg:w-1/2 p-6 sm:p-8 lg:p-12 flex flex-col justify-center">
              <div className="max-w-md mx-auto w-full">
                <div className="text-center mb-6">
                  <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                    {t.twoFactorTitle || "Two-Factor Verification"}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300">
                    {t.twoFactorSubtitle || "Enter the 6-digit code from your authenticator app"}
                  </p>
                  {email ? (
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {(t.signingInAs || "Signing in as:") + " " + email}
                    </p>
                  ) : null}
                </div>

                {error && (
                  <p className="text-red-600 dark:text-red-400 text-center text-sm mb-4">
                    {error}
                  </p>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <Input
                    type="text"
                    value={code}
                    onChange={(e) =>
                      setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder="000000"
                    maxLength={6}
                    className="text-center tracking-widest h-12 text-lg"
                    required
                    autoFocus
                  />

                  <Button
                    type="submit"
                    disabled={isLoading || code.length !== 6}
                    size="lg"
                    className="w-full"
                  >
                    {isLoading
                      ? t.verifying || "Verificando..."
                      : t.verifyButton || "Verificar"}
                  </Button>

                  <div className="text-center">
                    <Button
                      type="button"
                      variant="link"
                      onClick={() => {
                        try {
                          sessionStorage.removeItem("temp-2fa-data");
                        } catch {}
                        router.push(`/${locale}/signin`);
                      }}
                      className="text-sm"
                    >
                      {t.useDifferentAccount || "Use a different account"}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </NextIntlClientProvider>
  );
}

export default TwoFactorClient;