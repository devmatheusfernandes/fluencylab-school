"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { NextIntlClientProvider, useLocale } from "next-intl";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { BackButton } from "@/components/ui/back-button";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import BackgroundLogin from "@/public/images/login/background";
import { toast } from "sonner";

interface ForgotPasswordClientProps {
  messages: Record<string, Record<string, string>>;
}

export function ForgotPasswordClient({ messages }: ForgotPasswordClientProps) {
  const router = useRouter();
  const locale = useLocale();

  const [email, setEmail] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [localError, setLocalError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const t = messages?.Auth ?? {};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setIsLoading(true);

    if (!email) {
      setLocalError(t.emailRequired);
      setIsLoading(false);
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess(true);
      toast.success(t.resetEmailSent, {
        description: t.resetEmailSentDesc,
      });
    } catch (err: any) {
      console.error("Forgot password error", err);
      if (err.code === "auth/user-not-found") {
        setLocalError(t.userNotFound);
      } else if (err.code === "auth/invalid-email") {
        setLocalError(t.emailInvalid);
      } else {
        setLocalError(t.internalError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <div className="min-h-dvh w-full bg-background dark:bg-gray-950 flex items-center justify-center p-4 sm:p-6 relative">
        <BackButton
          href={`/${locale}/signin`}
          ariaLabel={t.backToLogin}
          className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10"
        />
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10">
          <LanguageSwitcher />
        </div>
        <div className="w-full max-w-5xl bg-white/60 dark:bg-gray-900 rounded-xl shadow-2xl overflow-hidden">
          <div className="flex flex-col lg:flex-row">
            <div className="hidden lg:flex flex-col items-center justify-center lg:w-1/2 bg-gray-100 dark:bg-gray-800 p-8 lg:p-12 relative min-h-[300px] lg:min-h-[600px]">
              <BackgroundLogin />
            </div>
            <div className="w-full lg:w-1/2 p-6 sm:p-8 lg:p-12 flex flex-col justify-center">
              <div className="max-w-md mx-auto w-full">
                <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                  {t.forgotPasswordTitle}
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-8">
                  {success ? t.resetEmailSentDesc : t.forgotPasswordDescription}
                </p>

                {!success ? (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t.email}
                      required
                    />

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full"
                      size="lg"
                    >
                      {isLoading ? (
                        <>
                          <Spinner aria-hidden="true" />
                          <span className="sr-only">{t.loading}</span>
                          {t.loading}
                        </>
                      ) : (
                        t.sendResetLink
                      )}
                    </Button>

                    {localError && (
                      <p className="text-red-600 dark:text-red-400 text-center text-sm mt-2">
                        {localError}
                      </p>
                    )}
                  </form>
                ) : (
                  <div className="space-y-5">
                     <Button
                      onClick={() => router.push(`/${locale}/signin`)}
                      className="w-full"
                      size="lg"
                    >
                      {t.backToLogin}
                    </Button>
                  </div>
                )}
                
                {!success && (
                  <p className="text-center text-gray-600 dark:text-gray-300 mt-8 text-sm">
                    <a
                      href={`/${locale}/signin`}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:dark:text-blue-300 font-medium underline"
                    >
                      {t.backToLogin}
                    </a>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </NextIntlClientProvider>
  );
}
