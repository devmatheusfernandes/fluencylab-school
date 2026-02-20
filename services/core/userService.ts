// services/userService.ts

import { adminAuth, adminDb } from "@/lib/firebase/admin";
import {
  userRepository,
  userAdminRepository,
  classRepository,
  paymentRepository,
} from "@/repositories";
import { StudentClass } from "@/types/classes/class";
import { Payment } from "@/types/financial/payments";
import { BankingInfo } from "@/types/onboarding/teacher";
import { FullUserDetails } from "@/types/users/userDetails";
import { User } from "@/types/users/users";
import { UserRoles } from "@/types/users/userRoles";
import { FieldValue } from "firebase-admin/firestore";
import { AuditService } from "@/services/core/auditService";
import { AdminService } from "@/services/admin/adminService";
import { emailService } from "../communication/emailService";

// Usando instâncias singleton centralizadas
const userAdminRepo = userAdminRepository;
const classRepo = classRepository;
const paymentRepo = paymentRepository;

export class UserService {
  async resendWelcomeLink(email: string) {
    try {
      const actionLink = await adminAuth.generatePasswordResetLink(email, {
        url: `${process.env.NEXTAUTH_URL}/create-password`,
        handleCodeInApp: true,
      });

      await emailService.sendSetPasswordEmailAgain(email, actionLink);

      return true;
    } catch (error) {
      console.error("Erro ao gerar link:", error);
      throw new Error("Falha ao gerar novo link de acesso.");
    }
  }

  async sendPasswordSetupEmail(email: string, locale?: string) {
    try {
      const actionLink = await adminAuth.generatePasswordResetLink(email, {
        url: `${process.env.NEXTAUTH_URL}/create-password`,
        handleCodeInApp: true,
      });

      await emailService.sendPasswordSetupEmail(email, actionLink, locale);

      return true;
    } catch (error) {
      console.error("Erro ao gerar link para definição de senha:", error);
      throw new Error("Falha ao gerar link para definição de senha.");
    }
  }

  async sendPasswordResetEmail(email: string, locale?: string) {
    try {
      const actionLink = await adminAuth.generatePasswordResetLink(email);
      await emailService.sendPasswordResetEmail(email, actionLink, locale);
      return true;
    } catch (error) {
      console.error("Erro ao gerar link de redefinição de senha:", error);
      throw error;
    }
  }

  /**
   * Obtém uma lista de usuários com base nos filtros fornecidos.
   */
  async getUsers(filters?: {
    role?: string;
    isActive?: boolean;
  }): Promise<User[]> {
    return await userAdminRepo.listUsers(filters);
  }

  /**
   * Alias para getUsers - mantém compatibilidade com código existente
   */
  async getAllUsers(filters?: {
    role?: string;
    isActive?: boolean;
  }): Promise<User[]> {
    return await this.getUsers(filters);
  }

  /**
   * Cria um novo usuário no sistema
   */
  async createUser(
    userData: {
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
    } & Partial<User>,
    auditData?: {
      ip?: string;
      userAgent?: string;
    },
  ): Promise<string> {
    try {
      // Usar AdminService para criação completa de usuários
      const adminService = new AdminService();
      const result = await adminService.createUser(userData);

      // Log da criação
      await AuditService.logUserAction({
        userId: result.newUser.id || "system",
        action: "CREATE_USER",
        targetUserId: result.newUser.id,
        details: {
          role: userData.role,
          email: userData.email,
          hasGuardian: !!userData.guardian,
        },
        ip: auditData?.ip,
        userAgent: auditData?.userAgent,
      });

      return result.newUser.id;
    } catch (error) {
      console.error("Erro ao criar usuário:", error);
      throw new Error("Falha ao criar usuário");
    }
  }

  // Método principal que o PATCH vai usar
  async updateUser(userId: string, userData: Partial<User>): Promise<void> {
    const allowedUpdates = { ...userData };
    // Adicione aqui outros campos que não podem ser alterados se necessário
    delete allowedUpdates.id;
    delete allowedUpdates.email;

    if (Object.keys(allowedUpdates).length > 0) {
      await userRepository.update(userId, allowedUpdates);
    }
  }

  // Método específico para desativar
  async deactivateUser(userId: string, date?: Date): Promise<void> {
    const effectiveDate = date ?? new Date();
    await this.updateUser(userId, {
      isActive: false,
      deactivatedAt: effectiveDate,
    });

    // Log the user deactivation event
    await AuditService.logEvent(
      "system", // or the admin user ID if available
      "USER_DEACTIVATED",
      "user",
      { userId },
    );
  }

  // Método específico para reativar
  async reactivateUser(userId: string): Promise<void> {
    // Usamos 'null' ou FieldValue.delete() para remover o campo deactivatedAt
    await this.updateUser(userId, {
      isActive: true,
      deactivatedAt: FieldValue.delete() as any,
    });

    // Log the user reactivation event
    await AuditService.logEvent(
      "system", // or the admin user ID if available
      "USER_REACTIVATED",
      "user",
      { userId },
    );
  }
  /**
   * Atualiza o perfil de um utilizador com dados seguros.
   * @param userId - O ID do utilizador que está a ser atualizado.
   * @param profileData - Os dados recebidos do formulário.
   */
  async updateUserProfile(
    userId: string,
    profileData: Partial<User>,
  ): Promise<void> {
    // 1. Define uma "lista segura" de campos que o utilizador pode editar
    const allowedUpdates: Partial<User> = {
      name: profileData.name,
      nickname: profileData.nickname,
      phoneNumber: profileData.phoneNumber,
      address: profileData.address,
      // avatarUrl será tratado separadamente (upload de imagem)
      // birthDate também pode ser adicionado aqui
    };

    // 2. Remove quaisquer campos 'undefined' para evitar erros no Firestore
    Object.keys(allowedUpdates).forEach(
      (key) =>
        (allowedUpdates as any)[key] === undefined &&
        delete (allowedUpdates as any)[key],
    );

    if (Object.keys(allowedUpdates).length === 0) {
      throw new Error("Nenhum dado válido para atualizar foi fornecido.");
    }

    // 3. Chama o repositório para salvar apenas os dados permitidos
    await userAdminRepo.update(userId, allowedUpdates);
  }

  /**
   * Atualiza as configurações de interface de um utilizador.
   * @param userId - O ID do utilizador a ser atualizado.
   * @param settingsData - Os dados de configuração (idioma, tema).
   */
  async updateUserSettings(
    userId: string,
    settingsData: {
      interfaceLanguage?: string;
      theme?: "light" | "dark";
      themeColor?: "violet" | "rose" | "indigo" | "yellow" | "green";
      twoFactorEnabled?: boolean;
      preferences?: {
        soundEffectsEnabled?: boolean;
        autoJoinClasses?: boolean;
        defaultClassDuration?: number;
        preferredTeachers?: string[];
        [key: string]: any;
      };
    },
  ): Promise<void> {
    // Define uma lista segura de campos que podem ser atualizados
    const allowedUpdates: Partial<User> = {};

    if (settingsData.interfaceLanguage) {
      allowedUpdates.interfaceLanguage = settingsData.interfaceLanguage;
    }
    if (settingsData.theme) {
      allowedUpdates.theme = settingsData.theme;
    }
    if (settingsData.themeColor) {
      allowedUpdates.themeColor = settingsData.themeColor;
    }
    if (settingsData.preferences) {
      // Fetch current user preferences to merge instead of overwrite
      const currentUser = await userAdminRepo.findUserById(userId);
      allowedUpdates.preferences = {
        ...(currentUser?.preferences || {}),
        ...settingsData.preferences,
      };
    }
    // Note: twoFactorEnabled is handled separately through the AuthService
    // We don't update it directly in the user document here

    if (Object.keys(allowedUpdates).length === 0) {
      throw new Error("Nenhum dado válido para atualizar foi fornecido.");
    }

    await userAdminRepo.update(userId, allowedUpdates);
  }

  async getFullUserDetails(userId: string): Promise<FullUserDetails | null> {
    // 1. Busca o perfil base do utilizador
    const userProfile = await userAdminRepo.findUserById(userId);
    if (!userProfile) {
      return null;
    }

    // 2. Busca dados agregados adicionais em paralelo
    // CORREÇÃO: Adiciona o tipo explícito para a variável
    let scheduledClasses: StudentClass[] = [];
    let bankingInfo: BankingInfo | undefined = undefined;

    if (userProfile.role === "student") {
      scheduledClasses = await classRepo.findAllClassesByStudentId(userId);
    } else if (userProfile.role === "teacher") {
      scheduledClasses = await classRepo.findAllClassesByTeacherId(userId);

      try {
        const bankingSnapshot = await adminDb
          .collection("teacherBankingInfo")
          .where("teacherId", "==", userId)
          .where("isActive", "==", true)
          .orderBy("createdAt", "desc")
          .limit(1)
          .get();

        if (!bankingSnapshot.empty) {
          const data = bankingSnapshot.docs[0].data();
          bankingInfo = {
            paymentMethod: data.paymentMethod || "account",
            accountType: data.accountType,
            bankCode: data.bankCode,
            bankName: data.bankName,
            agency: data.agency,
            accountNumber: data.accountNumber,
            accountDigit: data.accountDigit,
            cpf: data.cpf,
            fullName: data.fullName,
            pixKey: data.pixKey,
            pixKeyType: data.pixKeyType,
          };
        }
      } catch (error) {
        console.error("Erro ao buscar dados bancários:", error);
      }
    }
    // Adicione outras buscas aqui (contratos, pagamentos, etc.)

    // 3. Combina tudo num único objeto
    const fullDetails: FullUserDetails = {
      ...userProfile,
      scheduledClasses,
      bankingInfo,
    };

    return fullDetails;
  }

  async updateUserDetails(userId: string, data: Partial<User>): Promise<void> {
    // Define uma lista segura de campos que um admin pode editar
    const allowedUpdates: Partial<User> = {
      name: data.name,
      role: data.role,
      contractStartDate: data.contractStartDate,
      contractLengthMonths: data.contractLengthMonths,
      ratePerClassCents: data.ratePerClassCents,
      profile: data.profile,
      // Adicione outros campos que o admin pode editar aqui
    };

    // Remove quaisquer campos 'undefined'
    Object.keys(allowedUpdates).forEach(
      (key) =>
        (allowedUpdates as any)[key] === undefined &&
        delete (allowedUpdates as any)[key],
    );

    if (Object.keys(allowedUpdates).length === 0) {
      throw new Error("Nenhum dado válido para atualizar.");
    }

    // Get the current user data to check if role is changing
    const currentUser = await userAdminRepo.findUserById(userId);
    const isRoleChanging = data.role && currentUser?.role !== data.role;

    await userAdminRepo.update(userId, allowedUpdates);

    // If the role was changed, update Firebase Auth custom claims and log the event
    if (data.role) {
      await adminAuth.setCustomUserClaims(userId, { role: data.role });

      // Log the role change event if it actually changed
      if (isRoleChanging) {
        await AuditService.logEvent(
          "system", // or the admin user ID if available
          "USER_ROLE_CHANGED",
          "user",
          {
            userId,
            oldRole: currentUser?.role,
            newRole: data.role,
          },
        );
      }
    }
  }

  /**
   * Busca o histórico financeiro de um utilizador.
   * @param userId - O ID do utilizador.
   */
  async getUserFinancialHistory(userId: string): Promise<Payment[]> {
    // No futuro, podemos adicionar mais lógicas aqui, como calcular o total gasto.
    return await paymentRepo.findByUserId(userId);
  }

  /**
   * Atualiza a lista de professores associados a um aluno.
   * @param studentId - O ID do aluno a ser atualizado.
   * @param teacherIds - O array completo com os novos IDs de professores.
   */
  async manageStudentTeachers(
    studentId: string,
    teacherIds: string[],
  ): Promise<void> {
    // A validação de permissão (se o utilizador é Admin/Manager) é feita na API Route.
    // O serviço foca-se na lógica de negócio.

    // Garante que o input é um array para segurança
    if (!Array.isArray(teacherIds)) {
      throw new Error("A lista de professores deve ser um array.");
    }

    await userAdminRepo.update(studentId, { teachersIds: teacherIds });
  }

  /**
   * Updates the user's avatar URL in the database
   * @param userId - The ID of the user
   * @param avatarUrl - The new avatar URL
   */
  async updateUserAvatar(userId: string, avatarUrl: string): Promise<void> {
    if (!avatarUrl) {
      throw new Error("Avatar URL is required");
    }

    await userAdminRepo.update(userId, { avatarUrl });
  }
}

export const userService = new UserService();
