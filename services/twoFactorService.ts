// services/twoFactorService.ts
import { authenticator } from 'otplib';
import { adminDb } from '@/lib/firebase/admin';
import { User } from '@/types/users/users';

// Configure otplib
authenticator.options = {
  step: 30, // 30 seconds
  window: 1, // 1 window for validation
};

export class TwoFactorService {
  /**
   * Generates a secret key for 2FA
   */
  generateSecret(): string {
    return authenticator.generateSecret();
  }

  /**
   * Generates a QR code URL for the authenticator app
   */
  generateQRCodeURL(email: string, secret: string): string {
    return authenticator.keyuri(email, 'Fluency Lab', secret);
  }

  /**
   * Verifies a 2FA token
   */
  verifyToken(secret: string, token: string): boolean {
    try {
      return authenticator.check(token, secret);
    } catch (error) {
      console.error('2FA verification error:', error);
      return false;
    }
  }

  /**
   * Enables 2FA for a user
   */
  async enableTwoFactor(userId: string, secret: string): Promise<void> {
    const userRef = adminDb.collection('users').doc(userId);
    await userRef.update({
      twoFactorEnabled: true,
      twoFactorSecret: secret,
      twoFactorBackupCodes: this.generateBackupCodes(),
      updatedAt: new Date(),
    });
  }

  /**
   * Disables 2FA for a user
   */
  async disableTwoFactor(userId: string): Promise<void> {
    const userRef = adminDb.collection('users').doc(userId);
    await userRef.update({
      twoFactorEnabled: false,
      twoFactorSecret: null,
      twoFactorBackupCodes: null,
      updatedAt: new Date(),
    });
  }

  /**
   * Generates backup codes for 2FA
   */
  private generateBackupCodes(): string[] {
    const codes = [];
    for (let i = 0; i < 10; i++) {
      // Generate 8-character backup codes
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  /**
   * Verifies a backup code
   */
  async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (!userDoc.exists) return false;

    const userData = userDoc.data() as User & {
      twoFactorBackupCodes?: string[];
    };

    if (!userData.twoFactorBackupCodes) return false;

    return userData.twoFactorBackupCodes.includes(code);
  }

  /**
   * Invalidates a used backup code
   */
  async invalidateBackupCode(userId: string, code: string): Promise<void> {
    const userRef = adminDb.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) return;
    
    const userData = userDoc.data() as User & {
      twoFactorBackupCodes?: string[];
    };
    
    if (!userData.twoFactorBackupCodes) return;
    
    const updatedCodes = userData.twoFactorBackupCodes.filter(c => c !== code);
    await userRef.update({
      twoFactorBackupCodes: updatedCodes,
      updatedAt: new Date(),
    });
  }

  /**
   * Checks if a user has 2FA enabled
   */
  async isTwoFactorEnabled(userId: string): Promise<boolean> {
    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (!userDoc.exists) return false;
    
    const userData = userDoc.data() as User & {
      twoFactorEnabled?: boolean;
    };
    
    return !!userData.twoFactorEnabled;
  }

  /**
   * Gets 2FA secret for a user
   */
  async getTwoFactorSecret(userId: string): Promise<string | null> {
    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (!userDoc.exists) return null;
    
    const userData = userDoc.data() as User & {
      twoFactorSecret?: string;
    };
    
    return userData.twoFactorSecret || null;
  }
}