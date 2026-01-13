"use client";

import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
  ModalClose,
} from "../ui/modal";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Checkbox } from "../ui/checkbox";
import { SignatureFormData } from "@/types/contract";
import { Spinner } from "../ui/spinner";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: SignatureFormData) => Promise<void>;
  studentName: string;
}

const SignatureModal: React.FC<SignatureModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  studentName,
}) => {
  const t = useTranslations("SignatureModal");
  const [formData, setFormData] = useState<SignatureFormData>({
    cpf: "",
    name: studentName || "",
    birthDate: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    agreedToTerms: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setFormData({
        cpf: "",
        name: studentName || "",
        birthDate: "",
        address: "",
        city: "",
        state: "",
        zipCode: "",
        agreedToTerms: false,
      });
      setErrors({});
    }
  }, [isOpen, studentName]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }

    if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (name === "cpf") {
      // Format CPF as user types
      const formattedCpf = value
        .replace(/\D/g, "")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
      setFormData((prev) => ({ ...prev, [name]: formattedCpf }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleCheckboxChange = (checked: boolean) => {
    // Clear error for this field
    if (errors.agreedToTerms) {
      setErrors((prev) => ({ ...prev, agreedToTerms: "" }));
    }

    setFormData((prev) => ({ ...prev, agreedToTerms: checked }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Nome é obrigatório";
    }

    if (!formData.cpf.trim()) {
      newErrors.cpf = "CPF é obrigatório";
    } else if (!validateCPF(formData.cpf)) {
      newErrors.cpf = "CPF inválido";
    }

    if (!formData.birthDate) {
      newErrors.birthDate = "Data de nascimento é obrigatória";
    } else if (!isAdult(formData.birthDate)) {
      newErrors.birthDate = "É necessário ter 18 anos ou mais";
    }

    if (!formData.address.trim()) {
      newErrors.address = "Endereço é obrigatório";
    }

    if (!formData.city.trim()) {
      newErrors.city = "Cidade é obrigatória";
    }

    if (!formData.state.trim()) {
      newErrors.state = "Estado é obrigatório";
    }

    if (!formData.zipCode.trim()) {
      newErrors.zipCode = "CEP é obrigatório";
    }

    if (!formData.agreedToTerms) {
      newErrors.agreedToTerms = "Você deve concordar com os termos";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateCPF = (cpf: string): boolean => {
    const cleanCpf = cpf.replace(/[^\d]+/g, "");
    if (cleanCpf.length !== 11 || /^(\d)\1{10}$/.test(cleanCpf)) {
      return false;
    }

    let sum = 0;
    let remainder;

    for (let i = 1; i <= 9; i++) {
      sum += parseInt(cleanCpf.substring(i - 1, i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;

    if (remainder === 10 || remainder === 11) {
      remainder = 0;
    }
    if (remainder !== parseInt(cleanCpf.substring(9, 10))) {
      return false;
    }

    sum = 0;
    for (let i = 1; i <= 10; i++) {
      sum += parseInt(cleanCpf.substring(i - 1, i)) * (12 - i);
    }
    remainder = (sum * 10) % 11;

    if (remainder === 10 || remainder === 11) {
      remainder = 0;
    }
    if (remainder !== parseInt(cleanCpf.substring(10, 11))) {
      return false;
    }

    return true;
  };

  const isAdult = (birthDateString: string): boolean => {
    const birthDate = new Date(birthDateString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();

    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 18;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal open={isOpen}>
      <ModalContent className="max-w-2xl">
        <ModalHeader>
          <ModalTitle>{t("title")}</ModalTitle>
          <ModalDescription>
            {t("description")}
          </ModalDescription>
        </ModalHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                {t("nameLabel")}
              </label>
              <Input
                type="text"
                name="name"
                id="name"
                value={formData.name}
                onChange={handleChange}
                hasError={!!errors.name}
                required
              />
              {errors.name && (
                <p className="text-error text-sm mt-1">{errors.name}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="cpf"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  {t("cpfLabel")}
                </label>
                <Input
                  type="text"
                  name="cpf"
                  id="cpf"
                  value={formData.cpf}
                  onChange={handleChange}
                  hasError={!!errors.cpf}
                  maxLength={14}
                  required
                />
                {errors.cpf && (
                  <p className="text-error text-sm mt-1">{errors.cpf}</p>
                )}
              </div>

              {/* verificar se a data é igual a já registrada */}
              <div>
                <label
                  htmlFor="birthDate"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  {t("birthDateLabel")}
                </label>
                <Input
                  type="date"
                  name="birthDate"
                  id="birthDate"
                  value={formData.birthDate}
                  onChange={handleChange}
                  hasError={!!errors.birthDate}
                  required
                />
                {errors.birthDate && (
                  <p className="text-error text-sm mt-1">{errors.birthDate}</p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="address"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                {t("addressLabel")}
              </label>
              <Input
                type="text"
                name="address"
                id="address"
                value={formData.address}
                onChange={handleChange}
                hasError={!!errors.address}
                required
              />
              {errors.address && (
                <p className="text-error text-sm mt-1">{errors.address}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="city"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  {t("cityLabel")}
                </label>
                <Input
                  type="text"
                  name="city"
                  id="city"
                  value={formData.city}
                  onChange={handleChange}
                  hasError={!!errors.city}
                  required
                />
                {errors.city && (
                  <p className="text-error text-sm mt-1">{errors.city}</p>
                )}
              </div>
              <div>
                <label
                  htmlFor="state"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  {t("stateLabel")}
                </label>
                <Input
                  type="text"
                  name="state"
                  id="state"
                  value={formData.state}
                  onChange={handleChange}
                  hasError={!!errors.state}
                  required
                />
                {errors.state && (
                  <p className="text-error text-sm mt-1">{errors.state}</p>
                )}
              </div>
              <div>
                <label
                  htmlFor="zipCode"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  {t("zipCodeLabel")}
                </label>
                <Input
                  type="text"
                  name="zipCode"
                  id="zipCode"
                  value={formData.zipCode}
                  onChange={handleChange}
                  hasError={!!errors.zipCode}
                  required
                />
                {errors.zipCode && (
                  <p className="text-error text-sm mt-1">{errors.zipCode}</p>
                )}
              </div>
            </div>
          </div>

          <div
            className={`flex items-start gap-3 p-4 rounded-lg border transition-all duration-300 ${
              formData.agreedToTerms
                ? "border-success bg-success/10"
                : errors.agreedToTerms
                  ? "border-error bg-error/10"
                  : "border-surface-0/60"
            }`}
          >
            <Checkbox
              id="agreedToTerms"
              name="agreedToTerms"
              checked={formData.agreedToTerms}
              onCheckedChange={handleCheckboxChange}
            />
            <label
              htmlFor="agreedToTerms"
              className="text-sm text-gray-900 dark:text-gray-200 cursor-pointer leading-relaxed"
            >
              {t("termsLabel")}
            </label>
          </div>
          {errors.agreedToTerms && (
            <p className="text-error text-sm">{errors.agreedToTerms}</p>
          )}

          <ModalFooter>
            <Button type="button" onClick={onClose} disabled={isLoading}>
              <X size={18} className="mr-2" />
              {t("cancelButton")}
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!formData.agreedToTerms || isLoading}
              isLoading={isLoading}
            >
              {isLoading ? <Spinner /> : null}
              {isLoading ? t("signingButton") : t("signButton")}
            </Button>
          </ModalFooter>
        </form>

        <ModalClose />
      </ModalContent>
    </Modal>
  );
};

export default SignatureModal;
