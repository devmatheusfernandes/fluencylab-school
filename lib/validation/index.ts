// lib/validation/index.ts

// Exportar todas as funções de sanitização
export {
  sanitizeHtml,
  sanitizeText,
  sanitizeUrl,
  sanitizeEmail,
  sanitizePhone,
  sanitizeName,
  sanitizeId,
  sanitizeNumber,
  detectSqlInjection,
  detectXss,
  validateAndSanitize,
  createSanitizationMiddleware
} from './sanitization';

// Exportar todos os schemas
export {
  userValidationSchema,
  classValidationSchema,
  announcementValidationSchema,
  settingsValidationSchema,
  paymentValidationSchema,
  feedbackValidationSchema,
  availabilityValidationSchema,
  fileUploadValidationSchema,
  searchValidationSchema,
  authValidationSchema,
  passwordResetValidationSchema,
  validateApiInput,
  createValidationMiddleware
} from './schemas';

// Exportar middleware de validação
export {
  validateRequest,
  createApiValidationMiddleware,
  secureValidationMiddleware,
  withValidation,
  type ValidationMiddlewareConfig,
  type ValidationResult
} from './middleware';

// Exportar tipos úteis
export type {
  UserInput,
  ClassInput,
  AnnouncementInput,
  SettingsInput,
  PaymentInput,
  FeedbackInput,
  AvailabilityInput,
  FileUploadInput,
  SearchInput,
  AuthInput,
  PasswordResetInput
} from './schemas';