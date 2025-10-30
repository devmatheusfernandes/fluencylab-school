// lib/env/validation.ts

import { z } from "zod";

/**
 * Schemas de validação para environment variables
 * Separam variáveis de servidor e cliente para evitar validação indevida no browser
 */
const serverEnvSchema = z.object({
  // Node Environment
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  // NextAuth Configuration
  NEXTAUTH_URL: z.string().url("NEXTAUTH_URL deve ser uma URL válida"),
  NEXTAUTH_SECRET: z
    .string()
    .min(32, "NEXTAUTH_SECRET deve ter pelo menos 32 caracteres"),

  // Firebase Admin Configuration
  FIREBASE_ADMIN_PROJECT_ID: z
    .string()
    .min(1, "FIREBASE_ADMIN_PROJECT_ID é obrigatório"),
  FIREBASE_ADMIN_CLIENT_EMAIL: z
    .string()
    .email("FIREBASE_ADMIN_CLIENT_EMAIL deve ser um email válido"),
  FIREBASE_ADMIN_PRIVATE_KEY: z
    .string()
    .min(1, "FIREBASE_ADMIN_PRIVATE_KEY é obrigatório"),

  // Firebase Client Configuration (Public)
  NEXT_PUBLIC_FIREBASE_API_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_FIREBASE_API_KEY é obrigatório"),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z
    .string()
    .min(1, "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN é obrigatório"),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z
    .string()
    .min(1, "NEXT_PUBLIC_FIREBASE_PROJECT_ID é obrigatório"),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z
    .string()
    .min(1, "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET é obrigatório"),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z
    .string()
    .min(1, "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID é obrigatório"),
  NEXT_PUBLIC_FIREBASE_APP_ID: z
    .string()
    .min(1, "NEXT_PUBLIC_FIREBASE_APP_ID é obrigatório"),

  // Payment Configuration
  MERCADO_PAGO_ACCESS_TOKEN: z
    .string()
    .min(1, "MERCADO_PAGO_ACCESS_TOKEN é obrigatório"),
  MERCADO_PAGO_WEBHOOK_SECRET: z.string().optional(),

  // Email Configuration
  RESEND_API_KEY: z
    .string()
    .regex(/^re_/, "RESEND_API_KEY deve começar com re_"),

  // Google Calendar Integration
  GOOGLE_CLIENT_ID: z.string().min(1, "GOOGLE_CLIENT_ID é obrigatório"),
  GOOGLE_CLIENT_SECRET: z.string().min(1, "GOOGLE_CLIENT_SECRET é obrigatório"),

  // Encryption
  ENCRYPTION_SECRET: z
    .string()
    .min(32, "ENCRYPTION_SECRET deve ter pelo menos 32 caracteres"),

  // Application URLs
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url("NEXT_PUBLIC_APP_URL deve ser uma URL válida")
    .default("http://localhost:3000"),
});

// Schema mínimo para o cliente: apenas variáveis NEXT_PUBLIC
const clientEnvSchema = z.object({
  NEXT_PUBLIC_FIREBASE_API_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_FIREBASE_API_KEY é obrigatório"),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z
    .string()
    .min(1, "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN é obrigatório"),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z
    .string()
    .min(1, "NEXT_PUBLIC_FIREBASE_PROJECT_ID é obrigatório"),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z
    .string()
    .min(1, "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET é obrigatório"),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z
    .string()
    .min(1, "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID é obrigatório"),
  NEXT_PUBLIC_FIREBASE_APP_ID: z
    .string()
    .min(1, "NEXT_PUBLIC_FIREBASE_APP_ID é obrigatório"),
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url("NEXT_PUBLIC_APP_URL deve ser uma URL válida")
    .default("http://localhost:3000"),
});

/**
 * Tipo inferido do schema de environment variables
 */
export type ServerEnvConfig = z.infer<typeof serverEnvSchema>;
export type ClientEnvConfig = z.infer<typeof clientEnvSchema>;
// União/interseção para manter compatibilidade de tipos nas chamadas existentes
export type EnvConfig = ServerEnvConfig & ClientEnvConfig;

/**
 * Configuração validada das environment variables
 */
let validatedEnv: EnvConfig | null = null;

/**
 * Valida as environment variables usando o schema
 * @returns Configuração validada
 * @throws Error se alguma variável for inválida
 */
export function validateEnv(): EnvConfig {
  if (validatedEnv) {
    return validatedEnv;
  }

  try {
    const isServer = typeof window === "undefined";
    const schema = isServer ? serverEnvSchema : clientEnvSchema;

    // Important: In the browser, Next.js replaces `process.env.NEXT_PUBLIC_*`
    // at build time, but `process.env` itself is not populated.
    // So we must construct the client env explicitly using direct references.
    const envToValidate = isServer
      ? process.env
      : {
          NEXT_PUBLIC_FIREBASE_API_KEY:
            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
          NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:
            process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
          NEXT_PUBLIC_FIREBASE_PROJECT_ID:
            process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:
            process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
          NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:
            process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
          NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
          NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
        } as Record<string, string | undefined>;

    validatedEnv = schema.parse(envToValidate) as EnvConfig;
    return validatedEnv;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map((err) => {
        const path = err.path.join(".");
        return `${path}: ${err.message}`;
      });

      console.error("❌ Environment variables validation failed:");
      errorMessages.forEach((msg) => console.error(`  - ${msg}`));

      throw new Error(
        `Environment variables validation failed:\n${errorMessages.join("\n")}`
      );
    }
    throw error;
  }
}

/**
 * Obtém uma environment variable validada
 * @param key Chave da environment variable
 * @returns Valor validado
 */
export function getEnv<K extends keyof EnvConfig>(key: K): EnvConfig[K] {
  const env = validateEnv();
  return env[key];
}

/**
 * Verifica se todas as environment variables críticas estão definidas
 * @returns Lista de variáveis ausentes
 */
export function checkCriticalEnvVars(): string[] {
  // Apenas no servidor faz sentido verificar variáveis críticas
  if (typeof window !== "undefined") {
    return [];
  }

  const criticalVars = [
    "NEXTAUTH_SECRET",
    "FIREBASE_ADMIN_PROJECT_ID",
    "FIREBASE_ADMIN_CLIENT_EMAIL",
    "FIREBASE_ADMIN_PRIVATE_KEY",
    "ENCRYPTION_SECRET",
  ];

  return criticalVars.filter((varName) => !process.env[varName]);
}

// /**
//  * Verifica se há environment variables com valores inseguros
//  * @returns Lista de problemas de segurança encontrados
//  */
// export function checkSecurityIssues(): string[] {
//   const issues: string[] = [];

//   // Verificar se secrets não são valores padrão ou inseguros
//   const insecureValues = ['password', '123456', 'secret', 'test', 'development'];

//   const secretVars = [
//     'NEXTAUTH_SECRET',
//     'ENCRYPTION_SECRET',
//     'FIREBASE_ADMIN_PRIVATE_KEY'
//   ];

//   secretVars.forEach(varName => {
//     const value = process.env[varName];
//     if (value) {
//       if (insecureValues.some(insecure => value.toLowerCase().includes(insecure))) {
//         issues.push(`${varName} contém valor inseguro`);
//       }
//       if (value.length < 20) {
//         issues.push(`${varName} é muito curto (menos de 20 caracteres)`);
//       }
//     }
//   });

//   // Verificar se URLs de produção não apontam para localhost
//   if (process.env.NODE_ENV === 'production') {
//     const urlVars = ['NEXTAUTH_URL', 'NEXT_PUBLIC_APP_URL'];
//     urlVars.forEach(varName => {
//       const value = process.env[varName];
//       if (value && (value.includes('localhost') || value.includes('127.0.0.1'))) {
//         issues.push(`${varName} não deve apontar para localhost em produção`);
//       }
//     });
//   }

//   return issues;
// }

/**
 * Executa validação completa das environment variables
 * Inclui validação de schema, variáveis críticas e segurança
 */
export function runFullValidation(): void {
  console.log("🔍 Validando environment variables...");

  // 1. Verificar variáveis críticas
  const missingCritical = checkCriticalEnvVars();
  if (missingCritical.length > 0) {
    console.error("❌ Variáveis críticas ausentes:", missingCritical);
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        `Variáveis críticas ausentes: ${missingCritical.join(", ")}`
      );
    }
  }

  // // 2. Verificar problemas de segurança
  // const securityIssues = checkSecurityIssues();
  // if (securityIssues.length > 0) {
  //   console.warn("⚠️ Problemas de segurança encontrados:", securityIssues);
  //   if (process.env.NODE_ENV === "production") {
  //     throw new Error(`Problemas de segurança: ${securityIssues.join(", ")}`);
  //   }
  // }

  // 3. Validar schema completo
  try {
    validateEnv();
    console.log("✅ Environment variables validadas com sucesso");
  } catch (error) {
    console.error("❌ Falha na validação do schema:", error);
    throw error;
  }
}

/**
 * Utilitário para desenvolvimento - lista todas as env vars e seu status
 */
export function debugEnvVars(): void {
  if (process.env.NODE_ENV !== "development") {
    console.warn("debugEnvVars() só deve ser usado em desenvolvimento");
    return;
  }

  console.log("🐛 Debug Environment Variables:");
  const schema = (
    typeof window === "undefined" ? serverEnvSchema : clientEnvSchema
  ).shape;
  Object.keys(schema).forEach((key) => {
    const value = process.env[key];
    const status = value ? "✅" : "❌";
    const displayValue = value
      ? key.toLowerCase().includes("secret") ||
        key.toLowerCase().includes("key")
        ? "[HIDDEN]"
        : value
      : "undefined";

    console.log(`  ${status} ${key}: ${displayValue}`);
  });
}

// Auto-validação em produção (apenas servidor)
if (typeof window === "undefined" && process.env.NODE_ENV === "production") {
  runFullValidation();
}
