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
import { Link } from "lucide-react";
import { useTranslations } from "next-intl";

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

  // Price based on user role (this should come from server or context)
  const getSubscriptionPrice = () => {
    if (session?.user?.role === "GUARDED_STUDENT") {
      return 39900; // R$ 399,00 in centavos
    }
    return 29900; // R$ 299,00 in centavos
  };

  // Check for existing subscription
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
          // cardToken would be added here for credit card payments
        }),
      });

      if (response.ok) {
        const result = await response.json();

        if (selectedMethod === "pix") {
          toast.success(t("pixCreated"));
          window.location.href = "/hub/student/my-payments";
        } else {
          // Credit card flow with better messaging
          if (result.checkoutUrl) {
            toast.success(t("redirecting"));
            // Small delay to show the message
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

  if (!session?.user) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner />
      </div>
    );
  }

  if (checkingSubscription) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner />
      </div>
    );
  }

  // If user already has an active subscription, show the message
  if (hasActiveSubscription) {
    const isPending = subscriptionInfo?.status === "pending";
    const cardColor = isPending ? "orange" : "green";
    const bgColor = isPending ? "orange-50" : "green-50";
    const borderColor = isPending ? "orange-200" : "green-200";
    const iconColor = isPending ? "orange-500" : "green-500";
    const textColor = isPending ? "orange-800" : "green-800";
    const descriptionColor = isPending ? "orange-700" : "green-700";

    return (
      <div className="max-w-2xl mx-auto">
        <Card
          className={`p-8 text-center border-2 border-${borderColor} bg-${bgColor}`}
        >
          <div className="flex justify-center mb-4">
            <div className={`p-3 bg-${iconColor} rounded-full`}>
              {isPending ? (
                <Link className="w-8 h-8 text-white" />
              ) : (
                <Link className="w-8 h-8 text-white" />
              )}
            </div>
          </div>

          <h2 className={`text-2xl font-bold text-${textColor} mb-2`}>
            {isPending ? t("pendingTitle") : t("activeTitle")}
          </h2>

          <p className={`text-${descriptionColor} mb-6`}>
            {isPending ? t("pendingDesc") : t("activeDesc")}
          </p>

          {subscriptionInfo && (
            <div className="bg-white rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-gray-800 mb-3">
                {t("detailsTitle")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">{t("statusLabel")}</span>
                  <span className="ml-2 font-medium text-green-600 capitalize">
                    {subscriptionInfo.status}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">{t("methodLabel")}</span>
                  <span className="ml-2 font-medium">
                    {subscriptionInfo.paymentMethod === "pix"
                      ? "PIX"
                      : t("creditCardTitle")}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">{t("contractLabel")}</span>
                  <span className="ml-2 font-medium">
                    {t("months", { count: subscriptionInfo.contractLengthMonths })}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">{t("progressLabel")}</span>
                  <span className="ml-2 font-medium">
                    {t("paymentsCount", {
                      completed: subscriptionInfo.paymentsCompleted,
                      total: subscriptionInfo.totalPayments
                    })}
                  </span>
                </div>
              </div>
            </div>
          )}

          <Button
            onClick={() =>
              (window.location.href = "/hub/student/my-payments")
            }
            size="lg"
            className="w-full md:w-auto"
          >
            <Link className="w-4 h-4 mr-2" />
            {isPending ? t("finishPayment") : t("goToPayments")}
          </Button>
        </Card>
      </div>
    );
  }

  const subscriptionPrice = getSubscriptionPrice();
  const userType =
    session.user.role === "GUARDED_STUDENT"
      ? t("guardedStudent")
      : t("regularStudent");

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Plan Information */}
      <Card className="p-6 text-center border-2 border-blue-200 bg-blue-50">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Link className="w-5 h-5 text-blue-600" />
          <span className="text-sm font-medium text-blue-800">{t("planTitle")}</span>
        </div>
        <h2 className="text-2xl font-bold text-blue-900 mb-1">{userType}</h2>
        <p className="text-3xl font-bold text-blue-600 mb-2">
          {formatPrice(subscriptionPrice)}
          <span className="text-lg font-normal">{t("perMonth")}</span>
        </p>
        <p className="text-sm text-blue-700">
          {t("planDesc")}
        </p>
      </Card>

      {/* Payment Method Selection */}
      <div>
        <h3 className="text-xl font-semibold mb-4">
          {t("chooseMethod")}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* PIX Option */}
          <Card
            className={`p-6 cursor-pointer transition-all ${
              selectedMethod === "pix"
                ? "border-2 border-blue-500 bg-blue-50"
                : "border hover:border-gray-300"
            }`}
            onClick={() => setSelectedMethod("pix")}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Link className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold">{t("pixTitle")}</h4>
                  <p className="text-sm text-gray-600">
                    {t("pixDesc")}
                  </p>
                </div>
              </div>
              {selectedMethod === "pix" && (
                <div className="p-1 bg-blue-500 rounded-full">
                  <Link className="w-4 h-4 text-white" />
                </div>
              )}
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2">
                <Link className="w-4 h-4 text-green-500" />
                <span className="text-sm">{t("noFees")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Link className="w-4 h-4 text-green-500" />
                <span className="text-sm">{t("instantPayment")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Link className="w-4 h-4 text-green-500" />
                <span className="text-sm">{t("controlPayment")}</span>
              </div>
            </div>

            <Badge variant="secondary" className="w-full justify-center">
              {t("mostPopular")}
            </Badge>
          </Card>

          {/* Credit Card Option */}
          <Card
            className={`p-6 cursor-pointer transition-all ${
              selectedMethod === "credit_card"
                ? "border-2 border-purple-500 bg-purple-50"
                : "border hover:border-gray-300"
            }`}
            onClick={() => setSelectedMethod("credit_card")}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Link className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-semibold">{t("creditCardTitle")}</h4>
                  <p className="text-sm text-gray-600">{t("creditCardDesc")}</p>
                </div>
              </div>
              {selectedMethod === "credit_card" && (
                <div className="p-1 bg-purple-500 rounded-full">
                  <Link className="w-4 h-4 text-white" />
                </div>
              )}
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2">
                <Link className="w-4 h-4 text-green-500" />
                <span className="text-sm">{t("autoBilling")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Link className="w-4 h-4 text-green-500" />
                <span className="text-sm">{t("noWorries")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Link className="w-4 h-4 text-green-500" />
                <span className="text-sm">{t("allFlags")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Link className="w-4 h-4 text-green-500" />
                <span className="text-sm">{t("secureCheckout")}</span>
              </div>
            </div>

            <Badge className="w-full justify-center">
              {t("mostPractical")}
            </Badge>
          </Card>
        </div>
      </div>

      {/* Contract Length Selection */}
      <div>
        <h3 className="text-xl font-semibold mb-4">{t("contractDuration")}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 6 Months Option */}
          <Card
            className={`p-6 cursor-pointer transition-all ${
              contractLength === 6
                ? "border-2 border-green-500 bg-green-50"
                : "border hover:border-gray-300"
            }`}
            onClick={() => setContractLength(6)}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="font-semibold text-lg">{t("sixMonths")}</h4>
                <p className="text-sm text-gray-600">{t("flexibleContract")}</p>
              </div>
              {contractLength === 6 && (
                <div className="p-1 bg-green-500 rounded-full">
                  <Link className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Link className="w-4 h-4 text-green-500" />
                <span className="text-sm">{t("sixPayments")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Link className="w-4 h-4 text-green-500" />
                <span className="text-sm">{t("flexibleRenewal")}</span>
              </div>
            </div>
          </Card>

          {/* 12 Months Option */}
          <Card
            className={`p-6 cursor-pointer transition-all ${
              contractLength === 12
                ? "border-2 border-green-500 bg-green-50"
                : "border hover:border-gray-300"
            }`}
            onClick={() => setContractLength(12)}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="font-semibold text-lg">{t("twelveMonths")}</h4>
                <p className="text-sm text-gray-600">
                  {t("fullCommitment")}
                </p>
              </div>
              {contractLength === 12 && (
                <div className="p-1 bg-green-500 rounded-full">
                  <Link className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2">
                <Link className="w-4 h-4 text-green-500" />
                <span className="text-sm">{t("twelvePayments")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Link className="w-4 h-4 text-green-500" />
                <span className="text-sm">{t("guaranteedStability")}</span>
              </div>
            </div>
            <Badge variant="success" className="w-full justify-center">
              {t("recommended")}
            </Badge>
          </Card>
        </div>
      </div>

      {/* Billing Day Selection */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Link className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold">{t("billingDayTitle")}</h3>
        </div>
        <p className="text-gray-600 mb-4">
          {t("billingDayDesc")}
        </p>
        <div className="max-w-xs">
          <Input
            type="number"
            min="1"
            max="28"
            value={billingDay}
            onChange={(e) => setBillingDay(parseInt(e.target.value) || 5)}
            placeholder={t("billingDayPlaceholder")}
          />
        </div>
        <p className="text-sm text-gray-500 mt-2">
          {t("billingDayTip")}
        </p>
      </Card>

      {/* Terms and Action */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            <p className="mb-2">
              {t("noLoyalty")}
            </p>
            <p className="mb-2">
              {t("support247")}
            </p>
            <p className="mb-2">
              {t("cancellationFee")}
            </p>
            {selectedMethod === "credit_card" && (
              <p className="mb-2 text-blue-600">
                {t("securePayment")}
              </p>
            )}
          </div>

          <div className="pt-4 border-t">
            <Button
              onClick={createSubscription}
              disabled={!selectedMethod || creating}
              className="w-full"
              size="lg"
            >
              {creating ? (
                <>
                  <Spinner />
                  {t("creating")}
                </>
              ) : (
                t("createButton", { months: contractLength, price: formatPrice(subscriptionPrice) })
              )}
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            {t.rich("termsAgreement", {
              linkTerms: (chunks) => <a href="/terms" className="text-blue-600 hover:underline">{chunks}</a>,
              linkPrivacy: (chunks) => <a href="/privacy" className="text-blue-600 hover:underline">{chunks}</a>
            })}
          </p>
        </div>
      </Card>
    </div>
  );
}
