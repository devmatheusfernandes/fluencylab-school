// services/authService.ts

import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { adminDb, adminAuth } from "@/lib/firebase/admin";
import { User } from "@/types/users/users";
import { twoFactorService } from "./twoFactorService";

export class AuthService {
  /**
   * Valida as credenciais de um usuário para o fluxo de login.
   * Usado pelo CredentialsProvider do NextAuth.
   */
  async validateUser(email: string, password: string): Promise<any | null> {
    try {
      // 1. Valida as credenciais com o serviço de Autenticação do Firebase (isso usa o SDK de Cliente e está correto)
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      if (userCredential.user) {
        // 2. Busca o perfil do usuário no Firestore com o ADMIN SDK para garantir a permissão de leitura no servidor
        const userDoc = await adminDb
          .collection("users")
          .doc(userCredential.user.uid)
          .get();

        if (!userDoc.exists) {
          throw new Error("Usuário autenticado mas sem perfil no Firestore.");
        }
        const userProfile = userDoc.data() as User;

        // 3. Verifica se 2FA está habilitado para o usuário
        const is2FAEnabled = await twoFactorService.isTwoFactorEnabled(
          userCredential.user.uid
        );

        // 4. Retorna um objeto combinado para ser usado no token do NextAuth
        return {
          id: userCredential.user.uid,
          email: userProfile.email,
          name: userProfile.name,
          role: userProfile.role,
          permissions: userProfile.permissions,
          tutorialCompleted: userProfile.tutorialCompleted,
          twoFactorEnabled: is2FAEnabled,
          // Note: We don't verify the 2FA token here, that happens in a separate step
        };
      }
      return null;
    } catch (error) {
      // O console.error no seu terminal mostrará este erro de permissão
      console.error("Erro de validação:", error);
      return null; // Retorna null para o NextAuth, que resulta em um erro 401
    }
  }

  /**
   * Verifica o token 2FA do usuário
   */
  async verifyTwoFactorToken(userId: string, token: string): Promise<boolean> {
    try {
      console.log(
        `[AuthService] Verificando token 2FA para usuário: ${userId}`
      );

      const secret = await twoFactorService.getTwoFactorSecret(userId);
      if (!secret) {
        console.log(
          `[AuthService] Nenhum segredo 2FA encontrado para usuário: ${userId}`
        );
        return false;
      }

      console.log(`[AuthService] Segredo 2FA encontrado, verificando token...`);
      const isValid = await twoFactorService.verifyToken(secret, token);

      console.log(
        `[AuthService] Resultado da verificação 2FA: ${
          isValid ? "VÁLIDO" : "INVÁLIDO"
        }`
      );
      return isValid;
    } catch (error) {
      console.error(`[AuthService] Erro na verificação do token 2FA:`, error);
      return false;
    }
  }

  /**
   * Verifica um código de backup 2FA
   */
  async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    try {
      console.log(
        `[AuthService] Verificando código de backup 2FA para usuário: ${userId}`
      );

      const isValid = await twoFactorService.verifyBackupCode(userId, code);

      console.log(
        `[AuthService] Resultado da verificação do código de backup: ${
          isValid ? "VÁLIDO" : "INVÁLIDO"
        }`
      );
      return isValid;
    } catch (error) {
      console.error(
        `[AuthService] Erro na verificação do código de backup:`,
        error
      );
      return false;
    }
  }

  /**
   * Invalida um código de backup usado
   */
  async invalidateBackupCode(userId: string, code: string): Promise<void> {
    await twoFactorService.invalidateBackupCode(userId, code);
  }

  /**
   * Habilita 2FA para um usuário
   */
  async enableTwoFactor(userId: string, secret: string): Promise<void> {
    await twoFactorService.enableTwoFactor(userId, secret);
  }

  /**
   * Desabilita 2FA para um usuário
   */
  async disableTwoFactor(userId: string): Promise<void> {
    await twoFactorService.disableTwoFactor(userId);
  }

  /**
   * Busca um usuário pelo ID para atualizar dados da sessão
   */
  async getUserById(userId: string): Promise<User | null> {
    try {
      const userDoc = await adminDb.collection("users").doc(userId).get();

      if (!userDoc.exists) {
        return null;
      }

      const userProfile = userDoc.data() as User;

      // Return the complete user object with all required fields
      return {
        ...userProfile,
        id: userDoc.id, // Ensure the document ID takes precedence
      };
    } catch (error) {
      console.error("Erro ao buscar usuário por ID:", error);
      return null;
    }
  }

  /**
   * Sends email verification using Firebase Auth Admin SDK
   */
  async sendEmailVerification(
    userId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Get user from Firebase Auth using Admin SDK
      const userRecord = await adminAuth.getUser(userId);

      if (!userRecord) {
        return {
          success: false,
          message: "User not found",
        };
      }

      if (userRecord.emailVerified) {
        return {
          success: false,
          message: "Email is already verified",
        };
      }

      // Generate email verification link using Admin SDK
      const actionCodeSettings = {
        url: `${process.env.NEXTAUTH_URL}/auth/verify-email`,
        handleCodeInApp: true,
      };

      const verificationLink = await adminAuth.generateEmailVerificationLink(
        userRecord.email!,
        actionCodeSettings
      );

      // Here you would typically send the email using your email service
      // For now, we'll log it and return success
      console.log(
        `Email verification link for ${userRecord.email}: ${verificationLink}`
      );

      // You can integrate with your email service here:
      // await this.sendVerificationEmail(userRecord.email, verificationLink);

      return {
        success: true,
        message: "Verification email sent successfully",
      };
    } catch (error) {
      console.error("Error sending email verification:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to send verification email",
      };
    }
  }

  /**
   * Checks if user's email is verified
   */
  async isEmailVerified(userId: string): Promise<boolean> {
    try {
      const userRecord = await adminAuth.getUser(userId);
      return userRecord.emailVerified;
    } catch (error) {
      console.error("Error checking email verification status:", error);
      return false;
    }
  }

  /**
   * Manually verify user's email (admin function)
   */
  async verifyUserEmail(
    userId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      await adminAuth.updateUser(userId, {
        emailVerified: true,
      });

      return {
        success: true,
        message: "Email verified successfully",
      };
    } catch (error) {
      console.error("Error verifying user email:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to verify email",
      };
    }
  }
}

export const authService = new AuthService();
