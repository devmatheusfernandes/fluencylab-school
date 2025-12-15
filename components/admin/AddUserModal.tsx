"use client";

import { useState, useEffect } from "react";
import { UserRoles } from "@/types/users/userRoles";
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

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated: (userData: {
    name: string;
    email: string;
    role: UserRoles;
    birthDate?: Date;
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
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState(UserRoles.TEACHER);
  const [birthDate, setBirthDate] = useState<Date | null>(null);
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
        toast.info(
          "Role automaticamente ajustado",
          {
            description:
              "Menor de idade detectado - role alterado para Estudante Tutelado. Apenas estudantes tutelados são permitidos para menores de 18 anos.",
          }
        );
      }
    }
  }, [birthDate, role, toast]);

  // Validation function
  const validateForm = (): boolean => {
    const errors: string[] = [];

    if (!name.trim()) errors.push("Nome é obrigatório");

    // For guarded students (minors), email is optional as they use guardian's email
    // For other roles, email is required
    if (!isMinor || role !== UserRoles.GUARDED_STUDENT) {
      if (!email.trim()) errors.push("Email é obrigatório");
    }

    if (!birthDate) errors.push("Data de nascimento é obrigatória");

    // Validate age restriction for non-guarded students
    if (birthDate) {
      const age = calculateAge(birthDate);
      if (age < 18 && role !== UserRoles.GUARDED_STUDENT) {
        errors.push(
          "Usuários menores de 18 anos só podem ser estudantes tutelados"
        );
      }
    }

    if (isMinor && role === UserRoles.GUARDED_STUDENT) {
      if (!guardianName.trim())
        errors.push("Nome do responsável é obrigatório para menores");
      if (!guardianEmail.trim())
        errors.push("Email do responsável é obrigatório para menores");
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
      errors.push("Email do estudante deve ter formato válido");
    }
    if (guardianEmail && !emailRegex.test(guardianEmail)) {
      errors.push("Email do responsável deve ter formato válido");
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error(
        "Erro de validação",
        {
          description: "Por favor, corrija os erros antes de continuar",
        }
      );
      return;
    }

    toast.info(
      "Criando usuário...",
      {
        description: "Por favor aguarde enquanto processamos a solicitação",
      }
    );

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
      toast.success(
        "Usuário criado com sucesso!",
        {
          description: `Um email foi enviado para ${userData.email} com as instruções de acesso`,
        }
      );

      // Reset form
      setName("");
      setEmail("");
      setRole(UserRoles.TEACHER);
      setBirthDate(null);
      setGuardianName("");
      setGuardianEmail("");
      setGuardianPhone("");
      setGuardianRelationship("");
      setValidationErrors([]);
    } catch (error: any) {
      toast.error(
        "Erro ao criar usuário",
        {
          description: error.message || "Ocorreu um erro inesperado",
        }
      );
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
          <ModalTitle>Criar Novo Usuário</ModalTitle>
          <ModalDescription>
            Um e-mail será enviado para o utilizador definir a sua senha.
          </ModalDescription>
          <ModalClose />
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

            <ModalField label="Nome Completo" required>
              <ModalInput
                value={name}
                onChange={(e) => setName((e.target as HTMLInputElement).value)}
                placeholder="e.g., João Silva"
                required
              />
            </ModalField>

            <ModalField label="Data de Nascimento" required>
              <DatePicker
                value={birthDate}
                onChange={(date) => setBirthDate(date)}
                placeholder="Selecione a data de nascimento"
                maxDate={new Date()}
                required
              />
            </ModalField>

            <ModalField label="Tipo" required>
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
                      {roleValue === UserRoles.GUARDED_STUDENT
                        ? "Estudante Tutelado"
                        : roleValue === UserRoles.STUDENT
                          ? "Estudante"
                          : roleValue === UserRoles.TEACHER
                            ? "Professor"
                            : roleValue === UserRoles.ADMIN
                              ? "Administrador"
                              : roleValue === UserRoles.MANAGER
                                ? "Gestor"
                                : roleValue === UserRoles.MATERIAL_MANAGER
                                  ? "Gestor de Material"
                                  : roleValue}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </ModalField>

            {/* Student Email - Only show if not a minor or not a guarded student */}
            {!(isMinor && role === UserRoles.GUARDED_STUDENT) && (
              <ModalField label="Email" required>
                <ModalInput
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail((e.target as HTMLInputElement).value)
                  }
                  placeholder="e.g., joao.silva@email.com"
                  required
                />
              </ModalField>
            )}

            {/* Minor Alert */}
            {isMinor && (
              <Alert className="mb-4">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Menor de idade detectado!</strong>
                  {role === UserRoles.GUARDED_STUDENT
                    ? " O email do responsável será usado como email principal da conta."
                    : " Considere alterar o role para 'Estudante Tutelado' se necessário."}
                </AlertDescription>
              </Alert>
            )}

            {isMinor && role === UserRoles.GUARDED_STUDENT && (
              <>
                <div className="border-t pt-4 mt-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Dados do Responsável
                  </h3>
                </div>

                <ModalField label="Nome do Responsável" required>
                  <ModalInput
                    value={guardianName}
                    onChange={(e) =>
                      setGuardianName((e.target as HTMLInputElement).value)
                    }
                    placeholder="e.g., Maria Silva"
                    required
                  />
                </ModalField>

                <ModalField label="Email do Responsável" required>
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

                <ModalField label="Telefone do Responsável">
                  <ModalInput
                    type="tel"
                    value={guardianPhone}
                    onChange={(e) =>
                      setGuardianPhone((e.target as HTMLInputElement).value)
                    }
                    placeholder="e.g., (11) 99999-9999"
                  />
                </ModalField>

                <ModalField label="Parentesco">
                  <Select
                    value={guardianRelationship}
                    onValueChange={setGuardianRelationship}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o parentesco" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pai">Pai</SelectItem>
                      <SelectItem value="mãe">Mãe</SelectItem>
                      <SelectItem value="responsável legal">
                        Responsável Legal
                      </SelectItem>
                      <SelectItem value="avô">Avô</SelectItem>
                      <SelectItem value="avó">Avó</SelectItem>
                      <SelectItem value="tio">Tio</SelectItem>
                      <SelectItem value="tia">Tia</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </ModalField>

                {/* Email Notice for Minors */}
                <Alert className="mt-4">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Importante:</strong> O email do responsável será
                    usado como email principal da conta. O estudante poderá
                    acessar a plataforma através deste email.
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
              Cancelar
            </ModalSecondaryButton>
            <ModalPrimaryButton type="submit" disabled={isLoading}>
              {isLoading ? <Spinner /> : "Criar Usuário"}{" "}
              <Plus className="w-6 h-6" />
            </ModalPrimaryButton>
          </ModalFooter>
        </ModalForm>
      </ModalContent>
    </Modal>
  );
}
