"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileSignature,
  Eye,
  Calendar,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
} from "lucide-react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalPrimaryButton,
  ModalSecondaryButton,
  ModalDescription,
} from "@/components/ui/modal";
import { TeacherContractPDF } from "@/components/onboarding/steps/teacher/TeacherContractPDF";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { ContractStatus, ContractLog } from "@/types/contract";

interface ContractStatusData {
  student: any;
  contractStatus: ContractStatus | null;
  contractLog: ContractLog | null;
}

export const TeacherContractStatusCard = () => {
  const t = useTranslations("TeacherContractStatusCard");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ContractStatusData | null>(null);
  const [showContractModal, setShowContractModal] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    cnpj: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    agreedToTerms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/teacher/contract");
      if (res.ok) {
        const json = await res.json();
        setData(json);

        if (json.student) {
          setFormData((prev) => ({
            ...prev,
            name: json.student.name || "",
          }));
        }
      }
    } catch (e) {
      console.error(e);
      toast.error(t("errorLoading"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }

    if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (name === "cnpj") {
      const formattedCnpj = value
        .replace(/\D/g, "")
        .replace(/^(\d{2})(\d)/, "$1.$2")
        .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/\.(\d{3})(\d)/, ".$1/$2")
        .replace(/(\d{4})(\d)/, "$1-$2")
        .slice(0, 18);
      setFormData((prev) => ({ ...prev, [name]: formattedCnpj }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = t("nameRequired");
    if (!formData.cnpj.trim()) {
      newErrors.cnpj = t("cnpjRequired");
    } else if (formData.cnpj.replace(/\D/g, "").length !== 14) {
      newErrors.cnpj = t("cnpjInvalid");
    }
    if (!formData.address.trim()) newErrors.address = t("addressRequired");
    if (!formData.city.trim()) newErrors.city = t("cityRequired");
    if (!formData.state.trim()) newErrors.state = t("stateRequired");
    if (!formData.zipCode.trim()) newErrors.zipCode = t("zipCodeRequired");
    if (!formData.agreedToTerms) newErrors.agreedToTerms = t("termsRequired");

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignContract = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        cpf: formData.cnpj,
      };

      const response = await fetch("/api/onboarding/teacher/sign-contract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signatureData: payload,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to sign contract");
      }

      toast.success(t("successSigned"));
      setShowSignModal(false);
      fetchStatus();
    } catch (error) {
      console.error("Error signing contract:", error);
      toast.error(t("errorSigning"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRenewContract = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/teacher/contract/renew", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          renewalType: "manual",
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to renew contract");
      }

      toast.success(t("successRenewed"));
      fetchStatus();
    } catch (error: any) {
      console.error("Error renewing contract:", error);
      toast.error(error.message || t("errorRenewing"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <Skeleton className="h-48 w-full" />;

  const contractStatus = data?.contractStatus;
  const isCancelled = !!contractStatus?.cancelledAt;
  const isExpired =
    !isCancelled && contractStatus?.expiresAt
      ? new Date(contractStatus.expiresAt) < new Date()
      : false;
  const isSigned = !isCancelled && !isExpired && contractStatus?.signed;
  const isPending = !isCancelled && !isExpired && !isSigned;

  const expirationDate = contractStatus?.expiresAt
    ? new Date(contractStatus.expiresAt).toLocaleDateString("pt-BR")
    : t("undetermined");

  const signedDate = contractStatus?.signedAt
    ? new Date(contractStatus.signedAt).toLocaleDateString("pt-BR")
    : "-";

  return (
    <>
      <Card className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <FileSignature className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <Text
                size="lg"
                className="font-bold text-slate-900 dark:text-slate-100"
              >
                {t("contractTitle")}
              </Text>
              <Text size="sm" className="text-slate-600 dark:text-slate-400">
                {t("contractSubtitle")}
              </Text>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              {isSigned && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  {t("active")}
                </span>
              )}
              {isExpired && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {t("expired")}
                </span>
              )}
              {isCancelled && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {t("cancelled")}
                </span>
              )}
              {isPending && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {t("pending")}
                </span>
              )}
            </div>

            <div>
              {(isSigned || isExpired || isCancelled) && (
                <span
                  className="cursor-pointer inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                  onClick={() => setShowContractModal(true)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {t("viewContract")}
                </span>
              )}

              {(isExpired || isCancelled) && (
                <span
                  className="cursor-pointer inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                  onClick={handleRenewContract}
                >
                  <RefreshCw
                    className={`w-4 h-4 mr-2 ${isSubmitting ? "animate-spin" : ""}`}
                  />
                  {t("renewContract")}
                </span>
              )}

              {isPending && (
                <span
                  className="cursor-pointer inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                  onClick={() => setShowSignModal(true)}
                >
                  <FileSignature className="w-4 h-4 mr-2" />
                  {t("signContract")}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">
              {t("validity")}
            </div>
            <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              {expirationDate}
            </div>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">
              {t("signedAt")}
            </div>
            <div className="font-semibold text-slate-900 dark:text-slate-100">
              {signedDate}
            </div>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">
              {t("serviceTypeLabel")}
            </div>
            <div className="font-semibold text-slate-900 dark:text-slate-100">
              {t("serviceTypeValue")}
            </div>
          </div>
        </div>
      </Card>

      <Modal open={showContractModal} onOpenChange={setShowContractModal}>
        <ModalContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <ModalHeader>
            <h2 className="text-xl font-bold">{t("contractTitle")}</h2>
          </ModalHeader>
          <div className="p-4">
            {data?.contractLog ? (
              <TeacherContractPDF
                teacherName={data.contractLog.name}
                teacherCnpj={data.contractLog.cpf}
                teacherAddress={data.contractLog.address}
                teacherCity={data.contractLog.city}
                teacherState={data.contractLog.state}
                teacherZipCode={data.contractLog.zipCode}
                signedDate={data.contractLog.signedAt}
              />
            ) : (
              <div className="text-center py-8 text-gray-500">
                {t("contractNotFound")}
              </div>
            )}
          </div>
        </ModalContent>
      </Modal>

      <Modal open={showSignModal} onOpenChange={setShowSignModal}>
        <ModalContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <ModalHeader>
            <h2 className="text-xl font-bold">{t("signContractTitle")}</h2>
          </ModalHeader>
          <ModalDescription className="p-6">
            <div className="mb-6">
              <TeacherContractPDF
                teacherName={formData.name}
                teacherCnpj={formData.cnpj}
                teacherAddress={formData.address}
                teacherCity={formData.city}
                teacherState={formData.state}
                teacherZipCode={formData.zipCode}
              />
            </div>

            <div className="border-t pt-6">
              <Text variant="title" className="mb-4">
                {t("contractorData")}
              </Text>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">
                    {t("fullNameLabel")}
                  </label>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    hasError={!!errors.name}
                  />
                  {errors.name && (
                    <Text size="sm" className="text-red-500 mt-1">
                      {errors.name}
                    </Text>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t("cnpjLabel")}
                  </label>
                  <Input
                    name="cnpj"
                    value={formData.cnpj}
                    onChange={handleInputChange}
                    hasError={!!errors.cnpj}
                    placeholder={t("cnpjPlaceholder")}
                    maxLength={18}
                  />
                  {errors.cnpj && (
                    <Text size="sm" className="text-red-500 mt-1">
                      {errors.cnpj}
                    </Text>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t("zipCodeLabel")}
                  </label>
                  <Input
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleInputChange}
                    hasError={!!errors.zipCode}
                  />
                  {errors.zipCode && (
                    <Text size="sm" className="text-red-500 mt-1">
                      {errors.zipCode}
                    </Text>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">
                    {t("addressLabel")}
                  </label>
                  <Input
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder={t("addressPlaceholder")}
                    hasError={!!errors.address}
                  />
                  {errors.address && (
                    <Text size="sm" className="text-red-500 mt-1">
                      {errors.address}
                    </Text>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t("cityLabel")}
                  </label>
                  <Input
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    hasError={!!errors.city}
                  />
                  {errors.city && (
                    <Text size="sm" className="text-red-500 mt-1">
                      {errors.city}
                    </Text>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t("stateLabel")}
                  </label>
                  <Input
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    hasError={!!errors.state}
                  />
                  {errors.state && (
                    <Text size="sm" className="text-red-500 mt-1">
                      {errors.state}
                    </Text>
                  )}
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={formData.agreedToTerms}
                    onCheckedChange={(checked) => {
                      setFormData((prev) => ({
                        ...prev,
                        agreedToTerms: checked as boolean,
                      }));
                      if (errors.agreedToTerms)
                        setErrors((prev) => ({ ...prev, agreedToTerms: "" }));
                    }}
                  />
                  <div>
                    <Text size="sm">{t("agreeToTerms")}</Text>
                    {errors.agreedToTerms && (
                      <Text size="sm" className="text-red-500 mt-2">
                        {errors.agreedToTerms}
                      </Text>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </ModalDescription>
          <ModalFooter>
            <ModalSecondaryButton
              onClick={() => setShowSignModal(false)}
              disabled={isSubmitting}
            >
              {t("cancel")}
            </ModalSecondaryButton>
            <ModalPrimaryButton
              onClick={handleSignContract}
              disabled={!formData.agreedToTerms || isSubmitting}
            >
              {isSubmitting ? t("signing") : t("signDigitally")}
            </ModalPrimaryButton>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};
