"use client";
import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { NextIntlClientProvider, useLocale } from "next-intl";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { BackButton } from "@/components/ui/back-button";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import BackgroundLogin from "@/public/images/login/background";
import TransitionAnimation from "@/components/transitions/login";

interface SignInClientProps {
  messages: Record<string, Record<string, string>>;
}

export function SignInClient({ messages }: SignInClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated";
  const locale = useLocale();
  const callbackUrl = searchParams.get("callbackUrl") || "/hub";

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [localError, setLocalError] = React.useState<string | null>(null);
  const [showTransition, setShowTransition] = React.useState(false);

  React.useEffect(() => {
    if (isAuthenticated && !showTransition) {
      router.push(callbackUrl);
    }
  }, [isAuthenticated, router, callbackUrl, showTransition]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        if (result.error === "2FA_REQUIRED") {
          try {
            const tempData = {
              email,
              password,
              timestamp: Date.now(),
            };
            sessionStorage.setItem("temp-2fa-data", JSON.stringify(tempData));
            router.push(
              `/${locale}/signin/2fa?callbackUrl=${encodeURIComponent(
                callbackUrl
              )}`
            );
          } catch (fallbackError) {
            console.error("Erro no storage 2FA:", fallbackError);
            setLocalError(messages?.Auth?.internalError);
          }
        } else {
          // Map Firebase/NextAuth errors to user-friendly messages
          let errorMessage = messages?.Auth?.invalidCredentials;

          switch (result.error) {
            case "auth/user-not-found":
              errorMessage = messages?.Auth?.userNotFound;
              break;
            case "auth/wrong-password":
              errorMessage = messages?.Auth?.wrongPassword;
              break;
            case "auth/invalid-credential":
              errorMessage = messages?.Auth?.wrongPassword; // Usually implies wrong password or user not found, safer to say wrong password or generic
              break;
            case "auth/invalid-login-credentials":
              errorMessage = messages?.Auth?.invalidLoginCredentials;
              break;
            case "auth/user-disabled":
              errorMessage = messages?.Auth?.userDisabled;
              break;
            case "auth/too-many-requests":
              errorMessage = messages?.Auth?.tooManyRequests;
              break;
            case "CredentialsSignin":
              errorMessage = messages?.Auth?.invalidCredentials;
              break;
            default:
              errorMessage = messages?.Auth?.invalidCredentials;
          }

          setLocalError(errorMessage);
        }
      } else if (result?.ok) {
        setShowTransition(true);
        // Delay redirection to show the animation
        setTimeout(() => {
          router.push(callbackUrl);
          router.refresh();
        }, 7000);
      }
    } catch (err) {
      console.error("Sign in error", err);
      setLocalError(messages?.Auth?.internalError);
    }
  };

  if (isAuthenticated && !showTransition) return null;

  const t = messages?.Auth ?? {};

  if (showTransition) return <TransitionAnimation />;

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <div className="min-h-dvh w-full bg-background dark:bg-gray-950 flex items-center justify-center p-4 sm:p-6 relative">
        <BackButton
          href={`/${locale}`}
          ariaLabel={t.backAriaLabel}
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
                  {t.signinTitle}
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-8">
                  {t.description}
                </p>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.studentIdPlaceholder}
                    required
                  />

                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t.passwordPlaceholder}
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
                      t.submit
                    )}
                  </Button>

                  {localError && (
                    <p className="text-red-600 dark:text-red-400 text-center text-sm mt-2">
                      {localError}
                    </p>
                  )}
                </form>

              <div className="flex flex-col items-center gap-2">
                <p className="text-center text-gray-600 dark:text-gray-300 mt-8 text-sm">
                  {t.contactPrompt}{" "}
                  <a
                    href="#"
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:dark:text-blue-300 font-medium underline"
                  >
                    {t.contactLink}
                  </a>
                </p>
                <a
                  href={`/${locale}/forgot-password`}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:dark:text-blue-300 font-medium underline"
                >
                  {t.forgotPassword}
                </a>
              </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </NextIntlClientProvider>
  );
}
