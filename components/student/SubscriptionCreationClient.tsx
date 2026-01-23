"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { formatPrice } from "@/config/pricing";
import { Spinner } from "../ui/spinner";
import {
  CheckCircle2,
  Clock,
  CreditCard,
  QrCode,
  CalendarDays,
  CalendarClock,
  ShieldCheck,
  Crown,
  Zap,
  Lock,
  Check,
  Star,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Header } from "../ui/header";

// Utilitário para classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function SubscriptionCreationClient() {
  const t = useTranslations("SubscriptionCreationClient");
  const { data: session } = useSession();

  const [selectedMethod, setSelectedMethod] = useState<
    "pix" | "credit_card" | null
  >(null);
  const [billingDay, setBillingDay] = useState<number>(5);
  const [contractLength, setContractLength] = useState<6 | 12>(6);
  const [creating, setCreating] = useState(false);
  const [checkingSubscription, setCheckingSubscription] = useState(true);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [subscriptionInfo, setSubscriptionInfo] = useState<any>(null);

  // Price based on user role
  const getSubscriptionPrice = () => {
    if (session?.user?.role === "GUARDED_STUDENT") {
      return 39900; // R$ 399,00
    }
    return 29900; // R$ 299,00
  };

  useEffect(() => {
    const checkExistingSubscription = async () => {
      if (!session?.user) return;
      try {
        const response = await fetch("/api/student/subscription-status");
        if (response.ok) {
          const data = await response.json();
          setHasActiveSubscription(data.hasActiveSubscription);
          setSubscriptionInfo(data.subscription);
        }
      } catch (error) {
        console.error("Error checking subscription status:", error);
      } finally {
        setCheckingSubscription(false);
      }
    };
    checkExistingSubscription();
  }, [session?.user]);

  const createSubscription = async () => {
    if (!selectedMethod || !session?.user) {
      toast.error(t("selectMethod"));
      return;
    }

    if (billingDay < 1 || billingDay > 28) {
      toast.error(t("billingDayError"));
      return;
    }

    setCreating(true);
    try {
      const response = await fetch("/api/subscription/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMethod: selectedMethod,
          billingDay,
          contractLengthMonths: contractLength,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (selectedMethod === "pix") {
          toast.success(t("pixCreated"));
          window.location.href = "/hub/student/my-payments";
        } else {
          if (result.checkoutUrl) {
            toast.success(t("redirecting"));
            setTimeout(() => {
              window.location.href = result.checkoutUrl;
            }, 1500);
          } else {
            toast.success(t("createdSuccess"));
            window.location.href = "/hub/student/my-payments";
          }
        }
      } else {
        const error = await response.json();
        toast.error(error.message || t("createError"));
      }
    } catch (error) {
      console.error("Error creating subscription:", error);
      toast.error(t("createError"));
    } finally {
      setCreating(false);
    }
  };

  // --- RENDERING ---

  if (!session?.user || checkingSubscription) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner />
      </div>
    );
  }

  // View: Already Subscribed
  if (hasActiveSubscription) {
    const isPending = subscriptionInfo?.status === "pending";
    // Configurações visuais baseadas no estado
    const statusConfig = isPending
      ? {
          icon: Clock,
          bg: "bg-amber-50 dark:bg-amber-900/10",
          border: "border-amber-200 dark:border-amber-800",
          text: "text-amber-700 dark:text-amber-500",
          iconBg: "bg-amber-100 dark:bg-amber-800",
          title: t("pendingTitle"),
          desc: t("pendingDesc"),
        }
      : {
          icon: ShieldCheck,
          bg: "bg-emerald-50 dark:bg-emerald-900/10",
          border: "border-emerald-200 dark:border-emerald-800",
          text: "text-emerald-700 dark:text-emerald-500",
          iconBg: "bg-emerald-100 dark:bg-emerald-800",
          title: t("activeTitle"),
          desc: t("activeDesc"),
        };

    const StatusIcon = statusConfig.icon;

    return (
      <div className="max-w-2xl mx-auto mt-8">
        <Card
          className={cn(
            "p-8 text-center border overflow-hidden relative",
            statusConfig.bg,
            statusConfig.border,
          )}
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-20" />

          <div className="flex justify-center mb-6">
            <div
              className={cn("p-4 rounded-full shadow-sm", statusConfig.iconBg)}
            >
              <StatusIcon className={cn("w-10 h-10", statusConfig.text)} />
            </div>
          </div>

          <h2 className={cn("text-2xl font-bold mb-3", statusConfig.text)}>
            {statusConfig.title}
          </h2>

          <p className="text-zinc-600 dark:text-zinc-400 mb-8 max-w-md mx-auto">
            {statusConfig.desc}
          </p>

          {subscriptionInfo && (
            <div className="bg-white/80 dark:bg-zinc-900/80 rounded-xl p-6 mb-8 text-left border border-zinc-200 dark:border-zinc-800 shadow-sm backdrop-blur-sm">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                {t("detailsTitle")}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 text-sm">
                <div className="flex flex-col">
                  <span className="text-zinc-500">{t("statusLabel")}</span>
                  <span
                    className={cn("font-medium capitalize", statusConfig.text)}
                  >
                    {subscriptionInfo.status}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-zinc-500">{t("methodLabel")}</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {subscriptionInfo.paymentMethod === "pix"
                      ? "PIX"
                      : t("creditCardTitle")}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-zinc-500">{t("contractLabel")}</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {t("months", {
                      count: subscriptionInfo.contractLengthMonths,
                    })}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-zinc-500">{t("progressLabel")}</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {t("paymentsCount", {
                      completed: subscriptionInfo.paymentsCompleted,
                      total: subscriptionInfo.totalPayments,
                    })}
                  </span>
                </div>
              </div>
            </div>
          )}

          <Button
            onClick={() => (window.location.href = "/hub/student/my-payments")}
            size="lg"
            className={cn(
              "w-full md:w-auto font-semibold shadow-lg transition-all",
              isPending
                ? "bg-amber-600 hover:bg-amber-700 text-white"
                : "bg-emerald-600 hover:bg-emerald-700 text-white",
            )}
          >
            <CreditCard className="w-4 h-4 mr-2" />
            {isPending ? t("finishPayment") : t("goToPayments")}
          </Button>
        </Card>
      </div>
    );
  }

  // View: Create Subscription
  const subscriptionPrice = getSubscriptionPrice();
  const userType =
    session.user.role === "GUARDED_STUDENT"
      ? t("guardedStudent")
      : t("regularStudent");

  return (
    <div className="p-4 md:p-6 space-y-6">
      <Header heading={t("headerTitle")} subheading={t("headerSubtitle")} className="mb-10" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT COLUMN - CONFIGURATION */}
        <div className="lg:col-span-8 space-y-4">
          {/* 2. Payment Method */}
          <section>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
              <div className="w-6 h-6 rounded bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xs text-zinc-500">
                1
              </div>
              {t("chooseMethod")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Pix Card */}
              <div
                onClick={() => setSelectedMethod("pix")}
                className={cn(
                  "relative group p-6 rounded-xl border-2 cursor-pointer transition-all duration-200",
                  selectedMethod === "pix"
                    ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10 dark:border-emerald-500"
                    : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-emerald-200 dark:hover:border-emerald-900",
                )}
              >
                <div className="flex justify-between items-start mb-4">
                  <div
                    className={cn(
                      "p-2.5 rounded-lg transition-colors",
                      selectedMethod === "pix"
                        ? "bg-emerald-100 text-emerald-600"
                        : "bg-zinc-100 text-zinc-500 group-hover:bg-emerald-50 group-hover:text-emerald-500",
                    )}
                  >
                    <QrCode className="w-6 h-6" />
                  </div>
                  {selectedMethod === "pix" && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  )}
                </div>
                <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {t("pixTitle")}
                </h4>
                <p className="text-sm text-zinc-500 mt-1 mb-4">
                  {t("pixDesc")}
                </p>

                <div className="space-y-1.5">
                  {[t("noFees"), t("instantPayment"), t("controlPayment")].map(
                    (item, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400"
                      >
                        <Check className="w-3 h-3 text-emerald-500" />
                        {item}
                      </div>
                    ),
                  )}
                </div>
                <Badge
                  variant="secondary"
                  className="absolute -top-3 right-4 bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 border-0"
                >
                  {t("mostPopular")}
                </Badge>
              </div>

              {/* Credit Card Card */}
              <div
                onClick={() => setSelectedMethod("credit_card")}
                className={cn(
                  "relative group p-6 rounded-xl border-2 cursor-pointer transition-all duration-200",
                  selectedMethod === "credit_card"
                    ? "border-purple-500 bg-purple-50/50 dark:bg-purple-900/10 dark:border-purple-500"
                    : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-purple-200 dark:hover:border-purple-900",
                )}
              >
                <div className="flex justify-between items-start mb-4">
                  <div
                    className={cn(
                      "p-2.5 rounded-lg transition-colors",
                      selectedMethod === "credit_card"
                        ? "bg-purple-100 text-purple-600"
                        : "bg-zinc-100 text-zinc-500 group-hover:bg-purple-50 group-hover:text-purple-500",
                    )}
                  >
                    <CreditCard className="w-6 h-6" />
                  </div>
                  {selectedMethod === "credit_card" && (
                    <CheckCircle2 className="w-5 h-5 text-purple-500" />
                  )}
                </div>
                <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {t("creditCardTitle")}
                </h4>
                <p className="text-sm text-zinc-500 mt-1 mb-4">
                  {t("creditCardDesc")}
                </p>

                <div className="space-y-1.5">
                  {[t("autoBilling"), t("noWorries"), t("secureCheckout")].map(
                    (item, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400"
                      >
                        <Check className="w-3 h-3 text-purple-500" />
                        {item}
                      </div>
                    ),
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* 3. Contract Length */}
          <section>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
              <div className="w-6 h-6 rounded bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xs text-zinc-500">
                2
              </div>
              {t("contractDuration")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 6 Months */}
              <div
                onClick={() => setContractLength(6)}
                className={cn(
                  "p-5 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between",
                  contractLength === 6
                    ? "border-zinc-900 bg-zinc-50 dark:bg-zinc-800/50 dark:border-zinc-100"
                    : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300",
                )}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold">{t("sixMonths")}</h4>
                    <p className="text-xs text-zinc-500 mt-1">
                      {t("flexibleContract")}
                    </p>
                  </div>
                  {contractLength === 6 ? (
                    <div className="w-4 h-4 rounded-full bg-zinc-900 dark:bg-zinc-100" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-zinc-300" />
                  )}
                </div>
              </div>

              {/* 12 Months */}
              <div
                onClick={() => setContractLength(12)}
                className={cn(
                  "relative p-5 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between",
                  contractLength === 12
                    ? "border-blue-600 bg-blue-50/50 dark:bg-blue-900/10 dark:border-blue-500"
                    : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-blue-200",
                )}
              >
                <Badge
                  variant="default"
                  className="absolute -top-2.5 right-4 bg-blue-600 hover:bg-blue-700 text-xs px-2 h-5"
                >
                  {t("recommended")}
                </Badge>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold flex items-center gap-2">
                      {t("twelveMonths")}
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    </h4>
                    <p className="text-xs text-zinc-500 mt-1">
                      {t("fullCommitment")}
                    </p>
                  </div>
                  {contractLength === 12 ? (
                    <div className="w-4 h-4 rounded-full bg-blue-600" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-zinc-300" />
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* 4. Billing Day */}
          <section>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
              <div className="w-6 h-6 rounded bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xs text-zinc-500">
                3
              </div>
              {t("billingDayTitle")}
            </h3>
            <Card className="p-6 border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row gap-6 items-start md:items-center">
              <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                <CalendarClock className="w-6 h-6 text-zinc-500" />
              </div>
              <div className="flex-1">
                <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-3">
                  {t("billingDayDesc")}
                </p>
                <div className="flex items-center gap-3">
                  <div className="relative w-24">
                    <Input
                      type="number"
                      min="1"
                      max="28"
                      value={billingDay}
                      onChange={(e) =>
                        setBillingDay(parseInt(e.target.value) || 5)
                      }
                      className="font-semibold"
                    />
                  </div>
                  <span className="text-xs text-zinc-500">
                    {t("billingDayTip")}
                  </span>
                </div>
              </div>
            </Card>
          </section>
        </div>

        {/* RIGHT COLUMN - SUMMARY */}
        <div className="lg:col-span-4">
          <div className="sticky top-8 space-y-6">
            <Card className="p-6 border-zinc-200 dark:border-zinc-800 shadow-lg shadow-zinc-200/50 dark:shadow-none">
              <h3 className="font-semibold text-lg mb-4">
                {t("detailsTitle")}
              </h3>

              <div className="space-y-4 mb-6 text-sm">
                <div className="flex justify-between py-2 border-b border-zinc-100 dark:border-zinc-800">
                  <span className="text-zinc-500">{t("planTitle")}</span>
                  <span className="font-medium">{userType}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-zinc-100 dark:border-zinc-800">
                  <span className="text-zinc-500">{t("contractLabel")}</span>
                  <span className="font-medium">
                    {t("months", { count: contractLength })}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-zinc-100 dark:border-zinc-800">
                  <span className="text-zinc-500">{t("methodLabel")}</span>
                  <span className="font-medium">
                    {selectedMethod === "pix"
                      ? "PIX"
                      : selectedMethod === "credit_card"
                        ? t("creditCardTitle")
                        : "-"}
                  </span>
                </div>
                <div className="flex justify-between py-2 items-center">
                  <span className="text-foreground font-semibold">
                    {t("value")}
                  </span>
                  <span className="text-xl font-bold text-blue-600">
                    {formatPrice(subscriptionPrice)}
                  </span>
                </div>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-3 text-xs text-zinc-500 space-y-2 mb-6">
                <div className="flex items-center gap-2">
                  <Lock className="w-3 h-3 text-zinc-400" />
                  {t("securePayment")}
                </div>
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-3 h-3 text-zinc-400" />
                  {t("noLoyalty")}
                </div>
              </div>

              <Button
                onClick={createSubscription}
                disabled={!selectedMethod || creating}
                className="w-full text-base font-semibold"
                size="lg"
              >
                {creating ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    {t("creating")}
                  </>
                ) : (
                  t("createButton", {
                    months: contractLength,
                    price: formatPrice(subscriptionPrice),
                  })
                )}
              </Button>

              <p className="text-xs text-zinc-400 text-center mt-4 leading-relaxed">
                {t.rich("termsAgreement", {
                  linkTerms: (chunks) => (
                    <a
                      href="/terms"
                      className="text-zinc-600 dark:text-zinc-300 hover:underline"
                    >
                      {chunks}
                    </a>
                  ),
                  linkPrivacy: (chunks) => (
                    <a
                      href="/privacy"
                      className="text-zinc-600 dark:text-zinc-300 hover:underline"
                    >
                      {chunks}
                    </a>
                  ),
                })}
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
