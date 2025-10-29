import { webcrypto } from 'crypto';
import { getEnv } from '@/lib/env/validation';

/**
 * Módulo de criptografia para dados sensíveis
 * Utiliza AES-GCM para criptografia simétrica segura
 */

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits para AES-GCM

/**
 * Gera uma chave de criptografia a partir de uma senha
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await webcrypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return webcrypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Obtém a chave de criptografia do ambiente
 */
function getEncryptionPassword(): string {
  return getEnv('ENCRYPTION_SECRET');
}

/**
 * Criptografa uma string
 */
export async function encrypt(plaintext: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);
    
    // Gera salt e IV aleatórios
    const salt = webcrypto.getRandomValues(new Uint8Array(16));
    const iv = webcrypto.getRandomValues(new Uint8Array(IV_LENGTH));
    
    // Deriva a chave
    const password = getEncryptionPassword();
    const key = await deriveKey(password, salt);
    
    // Criptografa os dados
    const encrypted = await webcrypto.subtle.encrypt(
      { name: ALGORITHM, iv },
      key,
      data
    );
    
    // Combina salt + iv + dados criptografados
    const result = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
    result.set(salt, 0);
    result.set(iv, salt.length);
    result.set(new Uint8Array(encrypted), salt.length + iv.length);
    
    // Retorna como base64
    return Buffer.from(result).toString('base64');
  } catch (error) {
    console.error('Erro na criptografia:', error);
    throw new Error('Falha na criptografia');
  }
}

/**
 * Descriptografa uma string
 */
export async function decrypt(encryptedData: string): Promise<string> {
  try {
    const data = Buffer.from(encryptedData, 'base64');
    
    // Extrai salt, IV e dados criptografados
    const salt = data.slice(0, 16);
    const iv = data.slice(16, 16 + IV_LENGTH);
    const encrypted = data.slice(16 + IV_LENGTH);
    
    // Deriva a chave
    const key = await deriveKey(getEncryptionPassword(), salt);
    
    // Descriptografa os dados
    const decrypted = await webcrypto.subtle.decrypt(
      { name: ALGORITHM, iv },
      key,
      encrypted
    );
    
    // Retorna como string
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('Erro na descriptografia:', error);
    throw new Error('Falha na descriptografia');
  }
}

/**
 * Gera um hash seguro de uma string
 */
export async function hash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await webcrypto.subtle.digest('SHA-256', dataBuffer);
  return Buffer.from(hashBuffer).toString('hex');
}

/**
 * Gera um token aleatório seguro
 */
export function generateSecureToken(length: number = 32): string {
  const array = new Uint8Array(length);
  webcrypto.getRandomValues(array);
  return Buffer.from(array).toString('hex');
}