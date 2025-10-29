'use server';

import { cookies } from 'next/headers';
import { encrypt, decrypt } from '@/lib/crypto/encryption';

/**
 * Serviço seguro para armazenamento temporário de dados do 2FA
 * Substitui o uso inseguro de sessionStorage por cookies criptografados
 */

const TWO_FA_COOKIE_NAME = process.env.NODE_ENV === 'production' ? '__Secure-2fa-temp' : '2fa-temp';
const TWO_FA_EXPIRY = 10 * 60 * 1000; // 10 minutos

interface TwoFactorData {
  email: string;
  password: string;
  timestamp: number;
}

interface TwoFactorCredentials {
  email: string;
  password: string;
}

/**
 * Armazena dados temporários do 2FA de forma segura
 */
export async function storeTwoFactorData(email: string, password: string): Promise<void> {
  const data: TwoFactorData = {
    email,
    password,
    timestamp: Date.now()
  };

  const encryptedData = await encrypt(JSON.stringify(data));

  // Armazena em cookie seguro
  (await cookies()).set(TWO_FA_COOKIE_NAME, encryptedData, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: TWO_FA_EXPIRY / 1000 // 10 minutos
  });
}

/**
 * Recupera dados temporários do 2FA
 */
export async function getTwoFactorData(): Promise<TwoFactorCredentials | null> {
  try {
    const cookieStore = await cookies();
    const encryptedData = cookieStore.get(TWO_FA_COOKIE_NAME)?.value;

    if (!encryptedData) {
      return null;
    }

    const decryptedData = await decrypt(encryptedData);
    const data: TwoFactorData = JSON.parse(decryptedData);

    // Verifica se os dados não expiraram
    const isExpired = Date.now() - data.timestamp > TWO_FA_EXPIRY;

    if (isExpired) {
      await clearTwoFactorData();
      return null;
    }

    return {
      email: data.email,
      password: data.password
    };
  } catch (error) {
    console.error('Erro ao recuperar dados do 2FA:', error);
    return null;
  }
}

/**
 * Remove dados temporários do 2FA
 */
export async function clearTwoFactorData(): Promise<void> {
  (await cookies()).delete(TWO_FA_COOKIE_NAME);
}

/**
 * Valida se existem dados válidos do 2FA
 */
export async function hasTwoFactorData(): Promise<boolean> {
  const data = await getTwoFactorData();
  return data !== null;
}