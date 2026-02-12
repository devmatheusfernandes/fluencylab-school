"use client";

import { useState, useEffect } from "react";
import { UserRoles } from "@/types/users/userRoles";
import { useTranslations } from "next-intl";
import {
  Modal,
  ModalBody,
  ModalClose,
  ModalContent,
  ModalField,
  ModalFooter,
  ModalForm,
  ModalHeader,
  ModalInput,
  ModalPrimaryButton,
  ModalTitle,
  ModalDescription,
  ModalSecondaryButton,
  ModalIcon,
} from "@/components/ui/modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import DatePicker from "@/components/ui/date-picker";
import { toast } from "sonner";
import { FileWarning, Info, Plus } from "lucide-react";
import { Spinner } from "../ui/spinner";
import { Checkbox } from "../ui/checkbox";

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated: (userData: {
    name: string;
    email: string;
    role: UserRoles;
    birthDate?: Date;
    contractStartDate?: Date;
    languages?: string[];
    guardian?: {
      name: string;
      email: string;
      phoneNumber?: string;
      relationship?: string;
    };
  }) => Promise<void>;
  isLoading: boolean;
}

export default function AddUserModal({
  isOpen,
  onClose,
  onUserCreated,
  isLoading,
}: AddUserModalProps) {
  const t = useTranslations("UserManagement");
  const tRoles = useTranslations("UserRoles");
  const tLangs = useTranslations("UserDetails.schedule.languages");
  const tOverview = useTranslations("UserDetails.overview");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState(UserRoles.TEACHER);
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [contractStartDate, setContractStartDate] = useState<Date | null>(null);
  const [languages, setLanguages] = useState<string[]>([]);
  const [isMinor, setIsMinor] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Guardian fields
  const [guardianName, setGuardianName] = useState("");
  const [guardianEmail, setGuardianEmail] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");
  const [guardianRelationship, setGuardianRelationship] = useState("");

  // Function to calculate age and determine if user is minor
  const calculateAge = (birthDate: Date): number => {
    if (!birthDate) return 0;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  // Effect to check if user is minor and auto-set role
  useEffect(() => {
    if (birthDate) {
      const age = calculateAge(birthDate);
      const isUserMinor = age < 18;
      setIsMinor(isUserMinor);

      // Auto-set role to guarded student for users under 18
      if (isUserMinor && role !== UserRoles.GUARDED_STUDENT) {
        setRole(UserRoles.GUARDED_STUDENT);
        toast.info(t("minor.roleAdjustedTitle"), {
          description: t("minor.roleAdjustedDesc"),
        });
      }
    }
  }, [birthDate, role, toast, t]);

  // Validation function
  const validateForm = (): boolean => {
    const errors: string[] = [];

    if (!name.trim()) errors.push(t("validation.nameRequired"));

    // For guarded students (minors), email is optional as they use guardian's email
    // For other roles, email is required
    if (!isMinor || role !== UserRoles.GUARDED_STUDENT) {
      if (!email.trim()) errors.push(t("validation.emailRequired"));
    }

    if (!birthDate) errors.push(t("validation.birthDateRequired"));

    if (
      (role === UserRoles.STUDENT || role === UserRoles.GUARDED_STUDENT) &&
      !contractStartDate
    ) {
      errors.push("Data de início das aulas é obrigatória");
    }

    // Validate age restriction for non-guarded students
    if (birthDate) {
      const age = calculateAge(birthDate);
      if (age < 18 && role !== UserRoles.GUARDED_STUDENT) {
        errors.push(t("validation.underageRestriction"));
      }
    }

    if (isMinor && role === UserRoles.GUARDED_STUDENT) {
      if (!guardianName.trim())
        errors.push(t("validation.guardianNameRequired"));
      if (!guardianEmail.trim())
        errors.push(t("validation.guardianEmailRequired"));
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
      errors.push(t("validation.emailInvalid"));
    }
    if (guardianEmail && !emailRegex.test(guardianEmail)) {
      errors.push(t("validation.guardianEmailInvalid"));
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error(t("validation.errorTitle"), {
        description: t("validation.errorDescription"),
      });
      return;
    }

    toast.info(t("toasts.creatingUser"), {
      description: t("toasts.processing"),
    });

    const userData: any = {
      name,
      // For guarded students (minors), always use guardian email as the primary email
      email:
        isMinor && role === UserRoles.GUARDED_STUDENT && guardianEmail
          ? guardianEmail
          : email,
      role,
    };

    if (birthDate) {
      userData.birthDate = birthDate;
    }

    if (contractStartDate) {
      userData.contractStartDate = contractStartDate;
    }

    if (isMinor && guardianName && guardianEmail) {
      userData.guardian = {
        name: guardianName,
        email: guardianEmail,
        phoneNumber: guardianPhone || undefined,
        relationship: guardianRelationship || undefined,
      };
    }

    try {
      await onUserCreated(userData);
      toast.success("Usuário criado com sucesso!", {
        description: `Um email foi enviado com as instruções de acesso`,
      });

      // Reset form
      setName("");
      setEmail("");
      setRole(UserRoles.TEACHER);
      setBirthDate(null);
      setContractStartDate(null);
      setLanguages([]);
      setGuardianName("");
      setGuardianEmail("");
      setGuardianPhone("");
      setGuardianRelationship("");
      setValidationErrors([]);
    } catch (error: any) {
      toast.error("Erro ao criar usuário", {
        description: error.message || "Ocorreu um erro inesperado",
      });
    }
  };

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setName("");
      setEmail("");
      setRole(UserRoles.TEACHER);
      setBirthDate(null);
      setGuardianName("");
      setGuardianEmail("");
      setGuardianPhone("");
      setGuardianRelationship("");
      setValidationErrors([]);
    }
  }, [isOpen]);

  return (
    <Modal open={isOpen} onOpenChange={onClose}>
      <ModalContent>
        <ModalIcon type="success" />
        <ModalHeader>
          <ModalTitle>{t("createUserTitle")}</ModalTitle>
          <ModalDescription>{t("createUserDescription")}</ModalDescription>
        </ModalHeader>
        <ModalForm onSubmit={handleSubmit}>
          <ModalBody>
            {/* Validation Errors Alert */}
            {validationErrors.length > 0 && (
              <Alert variant="destructive" className="mb-4">
                <FileWarning className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <ModalField label={t("fullName")} required>
              <ModalInput
                value={name}
                onChange={(e) => setName((e.target as HTMLInputElement).value)}
                placeholder={t("fullNamePlaceholder")}
                required
              />
            </ModalField>

            <ModalField label={t("birthDate")} required>
              <DatePicker
                value={birthDate}
                onChange={(date) => setBirthDate(date)}
                placeholder={t("birthDatePlaceholder")}
                maxDate={new Date()}
                required
              />
            </ModalField>

            {(role === UserRoles.STUDENT ||
              role === UserRoles.GUARDED_STUDENT) && (
              <ModalField label="Data de Início das Aulas" required>
                <DatePicker
                  value={contractStartDate}
                  onChange={(date) => setContractStartDate(date)}
                  placeholder="Selecione a data de início"
                  required
                />
              </ModalField>
            )}

            <ModalField label={t("type")} required>
              <Select
                value={role}
                onValueChange={(value) => setRole(value as UserRoles)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(UserRoles).map((roleValue) => (
                    <SelectItem key={roleValue} value={roleValue}>
                      {tRoles(roleValue)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </ModalField>

            {(role === UserRoles.STUDENT ||
              role === UserRoles.GUARDED_STUDENT) && (
              <div className="space-y-2 mb-4">
                <span className="text-sm font-medium text-gray-700">
                  {tOverview("studyingLanguages")}
                </span>
                <div className="flex flex-wrap gap-3">
                  {["Inglês", "Espanhol", "Libras"].map((lang) => {
                    const checked = languages.includes(lang);
                    return (
                      <label key={lang} className="flex items-center gap-2">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(val) => {
                            const isChecked = Boolean(val);
                            setLanguages((prev) =>
                              isChecked
                                ? [...prev, lang]
                                : prev.filter((l) => l !== lang),
                            );
                          }}
                        />
                        <span className="text-sm text-gray-600">
                          {tLangs(lang)}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Student Email - Only show if not a minor or not a guarded student */}
            {!(isMinor && role === UserRoles.GUARDED_STUDENT) && (
              <ModalField label={t("email")} required>
                <ModalInput
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail((e.target as HTMLInputElement).value)
                  }
                  placeholder={t("emailPlaceholder")}
                  required
                />
              </ModalField>
            )}

            {/* Minor Alert */}
            {isMinor && (
              <Alert className="mb-4">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>{t("minor.detectedTitle")}</strong>
                  {role === UserRoles.GUARDED_STUDENT
                    ? ` ${t("minor.guardedStudentEmailNotice")}`
                    : ` ${t("minor.considerChangingRole")}`}
                </AlertDescription>
              </Alert>
            )}

            {isMinor && role === UserRoles.GUARDED_STUDENT && (
              <>
                <div className="border-t pt-4 mt-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    {t("minor.guardianData")}
                  </h3>
                </div>

                <ModalField label={t("minor.guardianName")} required>
                  <ModalInput
                    value={guardianName}
                    onChange={(e) =>
                      setGuardianName((e.target as HTMLInputElement).value)
                    }
                    placeholder="e.g., Maria Silva"
                    required
                  />
                </ModalField>

                <ModalField label={t("minor.guardianEmail")} required>
                  <ModalInput
                    type="email"
                    value={guardianEmail}
                    onChange={(e) =>
                      setGuardianEmail((e.target as HTMLInputElement).value)
                    }
                    placeholder="e.g., maria.silva@email.com"
                    required
                  />
                </ModalField>

                <ModalField label={t("minor.guardianPhone")}>
                  <ModalInput
                    type="tel"
                    value={guardianPhone}
                    onChange={(e) =>
                      setGuardianPhone((e.target as HTMLInputElement).value)
                    }
                    placeholder="e.g., (11) 99999-9999"
                  />
                </ModalField>

                <ModalField label={t("minor.relationship")}>
                  <Select
                    value={guardianRelationship}
                    onValueChange={setGuardianRelationship}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t("minor.relationshipPlaceholder")}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pai">
                        {t("relationships.father")}
                      </SelectItem>
                      <SelectItem value="mãe">
                        {t("relationships.mother")}
                      </SelectItem>
                      <SelectItem value="responsável legal">
                        {t("relationships.legalGuardian")}
                      </SelectItem>
                      <SelectItem value="avô">
                        {t("relationships.grandfather")}
                      </SelectItem>
                      <SelectItem value="avó">
                        {t("relationships.grandmother")}
                      </SelectItem>
                      <SelectItem value="tio">
                        {t("relationships.uncle")}
                      </SelectItem>
                      <SelectItem value="tia">
                        {t("relationships.aunt")}
                      </SelectItem>
                      <SelectItem value="outro">
                        {t("relationships.other")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </ModalField>

                {/* Email Notice for Minors */}
                <Alert className="mt-4">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{t("minor.importantNotice")}</strong>{" "}
                    {t("minor.emailUsageNotice")}
                  </AlertDescription>
                </Alert>
              </>
            )}
          </ModalBody>
          <ModalFooter>
            <ModalSecondaryButton
              type="button"
              onClick={onClose}
              disabled={isLoading}
            >
              {t("cancel")}
            </ModalSecondaryButton>
            <ModalPrimaryButton type="submit" disabled={isLoading}>
              {isLoading ? <Spinner /> : t("createUser")}{" "}
              <Plus className="w-6 h-6" />
            </ModalPrimaryButton>
          </ModalFooter>
        </ModalForm>
      </ModalContent>
    </Modal>
  );
}
