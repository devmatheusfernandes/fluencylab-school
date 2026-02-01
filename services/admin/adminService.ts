// services/adminService.ts

import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { User } from "@/types/users/users";
import { UserRoles } from "@/types/users/userRoles";
import { rolePermissionsMap } from "@/config/permissions";
import { EmailService } from "../communication/emailService";

const emailService = new EmailService();

export class AdminService {
  async createUser(userData: {
    name: string;
    email: string;
    role: UserRoles;
    birthDate?: Date;
    contractStartDate?: Date;
    guardian?: {
      name: string;
      email: string;
      phoneNumber?: string;
      relationship?: string;
    };
  }) {
    const { name, email, role, birthDate, contractStartDate, guardian } =
      userData;

    // Determina qual email usar para autenticação (responsável para menores)
    const authEmail = guardian?.email || email;
    const isMinor = role === UserRoles.GUARDED_STUDENT && guardian;

    // 1. Cria o usuário no Firebase Authentication SEM senha.
    // O usuário ficará em um estado onde só poderá logar após redefinir a senha.
    const userRecord = await adminAuth.createUser({
      email: authEmail, // Usa email do responsável se for menor
      displayName: isMinor ? `${name} (via ${guardian.name})` : name,
      emailVerified: true,
      // 🚫 Removemos a criação de senha temporária daqui
    });

    await adminAuth.setCustomUserClaims(userRecord.uid, { role });

    // 2. Cria o perfil do usuário no Firestore (como antes)
    const newUserProfile: Omit<User, "id"> = {
      name,
      email: authEmail, // Email usado para autenticação
      role,
      permissions: rolePermissionsMap[role] || [],
      createdAt: new Date(),
      isActive: true,
      avatarUrl: "",
      interfaceLanguage: "pt-BR",
      tutorialCompleted: false,
      ...(birthDate && { birthDate }),
      ...(contractStartDate && { contractStartDate }),
      ...(guardian && { guardian }),
      ...(role === UserRoles.TEACHER && { vacationDaysRemaining: 30 }),
    };

    await adminDb.collection("users").doc(userRecord.uid).set(newUserProfile);

    // 3. Gera o link para o usuário DEFINIR sua senha pela primeira vez
    const actionLink = await adminAuth.generatePasswordResetLink(authEmail, {
      url: `${process.env.NEXTAUTH_URL}/create-password`,
      handleCodeInApp: true,
    });

    // 4. Envia o e-mail de boas-vindas com o link
    const recipientName = isMinor ? guardian.name : name;
    const studentInfo = isMinor ? ` para o estudante ${name}` : "";
    await emailService.sendWelcomeAndSetPasswordEmail(
      authEmail,
      recipientName,
      actionLink,
      studentInfo,
    );

    // 5. Retorna o usuário criado, mas sem nenhuma senha
    return { newUser: { id: userRecord.uid, ...newUserProfile } };
  }
}

export const adminService = new AdminService();
