// lib/validation/schemas.ts

import { z } from "zod";
import { validateAndSanitize } from "./sanitization";

/**
 * Schema personalizado para sanitização automática
 */
function createSanitizedString(
  type: "text" | "html" | "email" | "url" | "phone" | "name" | "id"
) {
  return z.string().transform((val) => validateAndSanitize(val, type));
}

/**
 * Schemas básicos com sanitização
 */
export const sanitizedSchemas = {
  text: z.string(),
  html: z.string(),
  email: z.string(),
  url: z.string(),
  phone: z.string(),
  name: z.string(),
  id: z.string(),
  number: z.number(),
};

/**
 * Função para aplicar sanitização após validação
 */
function sanitizeAfterValidation<T extends z.ZodString>(
  schema: T,
  type: "text" | "html" | "email" | "url" | "phone" | "name" | "id"
) {
  return schema.transform((val) => validateAndSanitize(val, type));
}

/**
 * Schema para validação de usuário
 */
export const userValidationSchema = z.object({
  name: sanitizeAfterValidation(
    sanitizedSchemas.name
      .min(2, "Nome deve ter pelo menos 2 caracteres")
      .max(100, "Nome muito longo"),
    "name"
  ),
  email: sanitizeAfterValidation(
    sanitizedSchemas.email
      .email("Email inválido")
      .max(255, "Email muito longo"),
    "email"
  ),
  phone: sanitizeAfterValidation(sanitizedSchemas.phone, "phone").optional(),
  role: z.enum(["student", "teacher", "admin", "manager"]),
  profilePicture: sanitizeAfterValidation(
    sanitizedSchemas.url,
    "url"
  ).optional(),
});

/**
 * Schema para validação de aula
 */
export const classValidationSchema = z.object({
  title: sanitizeAfterValidation(
    sanitizedSchemas.text
      .min(3, "Título deve ter pelo menos 3 caracteres")
      .max(200, "Título muito longo"),
    "text"
  ),
  description: sanitizeAfterValidation(
    sanitizedSchemas.html.max(2000, "Descrição muito longa"),
    "html"
  ).optional(),
  teacherId: sanitizeAfterValidation(
    sanitizedSchemas.id.min(1, "ID do professor é obrigatório"),
    "id"
  ),
  studentId: sanitizeAfterValidation(
    sanitizedSchemas.id.min(1, "ID do estudante é obrigatório"),
    "id"
  ),
  startTime: z.date(),
  endTime: z.date(),
  status: z.enum([
    "scheduled",
    "in_progress",
    "completed",
    "cancelled",
    "rescheduled",
  ]),
  meetingUrl: sanitizeAfterValidation(sanitizedSchemas.url, "url").optional(),
  notes: sanitizeAfterValidation(
    sanitizedSchemas.html.max(5000, "Notas muito longas"),
    "html"
  ).optional(),
});

/**
 * Schema para validação de anúncio
 */
export const announcementValidationSchema = z.object({
  title: sanitizeAfterValidation(
    sanitizedSchemas.text
      .min(5, "Título deve ter pelo menos 5 caracteres")
      .max(200, "Título muito longo"),
    "text"
  ),
  content: sanitizeAfterValidation(
    sanitizedSchemas.html
      .min(10, "Conteúdo deve ter pelo menos 10 caracteres")
      .max(10000, "Conteúdo muito longo"),
    "html"
  ),
  type: z.enum(["info", "warning", "success", "error"]),
  targetRoles: z
    .array(z.enum(["student", "teacher", "admin", "manager"]))
    .min(1, "Pelo menos um role deve ser selecionado"),
  priority: z.enum(["low", "medium", "high"]),
  expiresAt: z.date().optional(),
});

/**
 * Schema para validação de configurações
 */
export const settingsValidationSchema = z.object({
  language: z.enum(["pt", "en", "es"]).default("pt"),
  timezone: sanitizeAfterValidation(
    sanitizedSchemas.text.max(50, "Timezone inválido"),
    "text"
  ),
  theme: z.enum(["light", "dark", "system"]).default("system"),
  notifications: z
    .object({
      email: z.boolean().default(true),
      push: z.boolean().default(true),
      sms: z.boolean().default(false),
    })
    .default({ email: true, push: true, sms: false }),
  schedulingSettings: z
    .object({
      autoConfirm: z.boolean().default(false),
      reminderTime: z.number().min(5).max(1440).default(60), // em minutos
      maxAdvanceBooking: z.number().min(1).max(365).default(30), // em dias
    })
    .optional(),
  paymentSettings: z
    .object({
      currency: z.enum(["BRL", "USD", "EUR"]).default("BRL"),
      autoCharge: z.boolean().default(false),
    })
    .optional(),
});

/**
 * Schema para validação de pagamento
 */
export const paymentValidationSchema = z.object({
  amount: z
    .number()
    .positive("Valor deve ser positivo")
    .max(10000, "Valor muito alto"),
  currency: z.enum(["BRL", "USD", "EUR"]).default("BRL"),
  method: z.enum(["credit_card", "debit_card", "pix", "bank_transfer"]),
  description: sanitizeAfterValidation(
    sanitizedSchemas.text.max(500, "Descrição muito longa"),
    "text"
  ).optional(),
  metadata: z.record(z.string(), z.string()).optional(),
});

/**
 * Schema para validação de feedback
 */
export const feedbackValidationSchema = z.object({
  classId: sanitizeAfterValidation(
    sanitizedSchemas.id.min(1, "ID da aula é obrigatório"),
    "id"
  ),
  rating: z
    .number()
    .min(1, "Avaliação mínima é 1")
    .max(5, "Avaliação máxima é 5"),
  comment: sanitizeAfterValidation(
    sanitizedSchemas.html.max(2000, "Comentário muito longo"),
    "html"
  ).optional(),
  isAnonymous: z.boolean().default(false),
});

/**
 * Schema para validação de disponibilidade
 */
export const availabilityValidationSchema = z.object({
  teacherId: sanitizeAfterValidation(
    sanitizedSchemas.id.min(1, "ID do professor é obrigatório"),
    "id"
  ),
  dayOfWeek: z
    .number()
    .min(0, "Dia da semana inválido")
    .max(6, "Dia da semana inválido"),
  startTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato de hora inválido"),
  endTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato de hora inválido"),
  isRecurring: z.boolean().default(true),
  validFrom: z.date().optional(),
  validUntil: z.date().optional(),
});

/**
 * Schema para validação de upload de arquivo
 */
export const fileUploadValidationSchema = z.object({
  fileName: sanitizeAfterValidation(
    sanitizedSchemas.text
      .min(1, "Nome do arquivo é obrigatório")
      .max(255, "Nome do arquivo muito longo"),
    "text"
  ),
  fileSize: z
    .number()
    .positive("Tamanho do arquivo deve ser positivo")
    .max(50 * 1024 * 1024, "Arquivo muito grande (máximo 50MB)"),
  mimeType: z
    .string()
    .regex(
      /^[a-zA-Z0-9][a-zA-Z0-9!#$&\-\^_]*\/[a-zA-Z0-9][a-zA-Z0-9!#$&\-\^_.]*$/,
      "Tipo MIME inválido"
    ),
  purpose: z.enum(["avatar", "document", "image", "video", "audio"]),
});

/**
 * Schema para validação de busca/filtros
 */
export const searchValidationSchema = z.object({
  query: sanitizeAfterValidation(
    sanitizedSchemas.text.max(200, "Consulta muito longa"),
    "text"
  ).optional(),
  page: z.number().min(1, "Página deve ser pelo menos 1").default(1),
  limit: z
    .number()
    .min(1, "Limite deve ser pelo menos 1")
    .max(100, "Limite máximo é 100")
    .default(20),
  sortBy: sanitizeAfterValidation(
    sanitizedSchemas.text.max(50, "Campo de ordenação inválido"),
    "text"
  ).optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  filters: z
    .record(
      z.string(),
      z.union([z.string(), z.number(), z.boolean(), z.array(z.string())])
    )
    .optional(),
});

/**
 * Schema para validação de autenticação
 */
export const authValidationSchema = z.object({
  email: sanitizeAfterValidation(
    sanitizedSchemas.email.email("Email inválido"),
    "email"
  ),
  password: z
    .string()
    .min(8, "Senha deve ter pelo menos 8 caracteres")
    .max(128, "Senha muito longa"),
  rememberMe: z.boolean().default(false),
  twoFactorCode: z
    .string()
    .regex(/^[0-9]{6}$/, "Código 2FA deve ter 6 dígitos")
    .optional(),
});

/**
 * Schema para validação de redefinição de senha
 */
export const passwordResetValidationSchema = z
  .object({
    token: sanitizeAfterValidation(
      sanitizedSchemas.text.min(1, "Token é obrigatório"),
      "text"
    ),
    newPassword: z
      .string()
      .min(8, "Senha deve ter pelo menos 8 caracteres")
      .max(128, "Senha muito longa"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Senhas não coincidem",
    path: ["confirmPassword"],
  });

/**
 * Utilitário para validar dados de entrada de API
 */
export function validateApiInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map((err) => {
        const path = err.path.join(".");
        return `${path}: ${err.message}`;
      });
      throw new Error(`Validation failed: ${errorMessages.join(", ")}`);
    }
    throw error;
  }
}

/**
 * Middleware para validação automática de request body
 */
export function createValidationMiddleware<T>(schema: z.ZodSchema<T>) {
  return function validateRequest(data: unknown): T {
    return validateApiInput(schema, data);
  };
}

// Tipos de entrada para TypeScript
export type UserInput = z.infer<typeof userValidationSchema>;
export type ClassInput = z.infer<typeof classValidationSchema>;
export type AnnouncementInput = z.infer<typeof announcementValidationSchema>;
export type SettingsInput = z.infer<typeof settingsValidationSchema>;
export type PaymentInput = z.infer<typeof paymentValidationSchema>;
export type FeedbackInput = z.infer<typeof feedbackValidationSchema>;
export type AvailabilityInput = z.infer<typeof availabilityValidationSchema>;
export type FileUploadInput = z.infer<typeof fileUploadValidationSchema>;
export type SearchInput = z.infer<typeof searchValidationSchema>;
export type AuthInput = z.infer<typeof authValidationSchema>;
export type PasswordResetInput = z.infer<typeof passwordResetValidationSchema>;

/**
 * Schema para validação de Quiz
 */
export const quizQuestionSchema = z.object({
  text: z.string(),
  options: z.array(z.string()).length(4),
  correctIndex: z.number().min(0).max(3),
  explanation: z.string().optional(),
});

export const quizSectionSchema = z.object({
  type: z.enum(['vocabulary', 'grammar', 'timestamps', 'context', 'comprehension']),
  questions: z.array(quizQuestionSchema),
});

export const quizSchema = z.object({
  quiz_metadata: z.object({
    title: z.string(),
    level: z.string(),
    dateGenerated: z.string(),
  }),
  quiz_sections: z.array(quizSectionSchema),
});

export type QuizInput = z.infer<typeof quizSchema>;
