// lib/env/index.ts

// Re-export all validation utilities
export {
  validateEnv,
  getEnv,
  checkCriticalEnvVars,
  runFullValidation,
  debugEnvVars,
} from "./validation";
export { initializeApp, createEnvValidationMiddleware } from "./startup";
export type { EnvConfig } from "./validation";

// Initialize validation on import in production
if (typeof window === "undefined" && process.env.NODE_ENV === "production") {
  // Only run on server-side in production
  import("./startup")
    .then(({ initializeApp }) => {
      initializeApp();
    })
    .catch((error) => {
      console.error("Failed to initialize app:", error);
      process.exit(1);
    });
}
