// lib/env/startup.ts

import { runFullValidation, debugEnvVars } from "./validation";

/**
 * Executa validações de inicialização da aplicação
 * Deve ser chamado no início da aplicação
 */
export function initializeApp(): void {
  try {
    // Executar validação completa das environment variables
    runFullValidation();

    // Em desenvolvimento, mostrar debug das env vars
    if (process.env.NODE_ENV === "development") {
      debugEnvVars();
    }
  } catch (error) {
    // Em produção, falhar completamente
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    }
  }
}

/**
 * Middleware para Next.js que executa validações
 */
export function createEnvValidationMiddleware() {
  return function envValidationMiddleware() {
    // Executar validação apenas uma vez
    if (!global.__envValidated) {
      initializeApp();
      global.__envValidated = true;
    }
  };
}

// Declaração global para TypeScript
declare global {
  var __envValidated: boolean | undefined;
}
