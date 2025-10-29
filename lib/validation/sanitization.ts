// lib/validation/sanitization.ts
import DOMPurify from "isomorphic-dompurify";

/**
 * Configurações de sanitização por contexto
 */
export const SANITIZATION_CONFIGS = {
  // Para conteúdo HTML que será exibido
  HTML_CONTENT: {
    ALLOWED_TAGS: [
      "p",
      "br",
      "strong",
      "em",
      "u",
      "ol",
      "ul",
      "li",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
    ],
    ALLOWED_ATTR: ["class", "id"],
    FORBID_TAGS: [
      "script",
      "style",
      "iframe",
      "object",
      "embed",
      "form",
      "input",
      "button",
    ],
    FORBID_ATTR: [
      "onclick",
      "onload",
      "onerror",
      "onmouseover",
      "onfocus",
      "onblur",
    ],
  },

  // Para texto simples (sem HTML)
  PLAIN_TEXT: {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    STRIP_TAGS: true,
  },

  // Para URLs
  URL: {
    ALLOWED_URI_REGEXP: /^https?:\/\//,
  },
} as const;

/**
 * Sanitiza HTML removendo elementos perigosos
 */
export function sanitizeHtml(
  input: string,
  config = SANITIZATION_CONFIGS.HTML_CONTENT
): string {
  if (typeof input !== "string") {
    throw new Error("Input must be a string");
  }

  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [...config.ALLOWED_TAGS],
    ALLOWED_ATTR: [...config.ALLOWED_ATTR],
    FORBID_TAGS: [...config.FORBID_TAGS],
    FORBID_ATTR: [...config.FORBID_ATTR],
  });
}

/**
 * Sanitiza texto removendo todos os elementos HTML
 */
export function sanitizeText(input: string): string {
  if (typeof input !== "string") {
    throw new Error("Input must be a string");
  }

  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}

/**
 * Sanitiza e valida URLs
 */
export function sanitizeUrl(input: string): string {
  if (typeof input !== "string") {
    throw new Error("Input must be a string");
  }

  // Remove espaços em branco
  const trimmed = input.trim();

  // Verifica se é uma URL válida
  try {
    const url = new URL(trimmed);

    // Só permite HTTP e HTTPS
    if (!["http:", "https:"].includes(url.protocol)) {
      throw new Error("Only HTTP and HTTPS URLs are allowed");
    }

    return url.toString();
  } catch (error) {
    throw new Error("Invalid URL format");
  }
}

/**
 * Remove caracteres de controle e normaliza espaços
 */
export function normalizeText(input: string): string {
  if (typeof input !== "string") {
    throw new Error("Input must be a string");
  }

  return (
    input
      // Remove caracteres de controle (exceto \n, \r, \t)
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
      // Normaliza espaços múltiplos
      .replace(/\s+/g, " ")
      // Remove espaços no início e fim
      .trim()
  );
}

/**
 * Sanitiza entrada de email
 */
export function sanitizeEmail(input: string): string {
  if (typeof input !== "string") {
    throw new Error("Input must be a string");
  }

  return normalizeText(input.toLowerCase());
}

/**
 * Sanitiza entrada de telefone (remove caracteres não numéricos)
 */
export function sanitizePhone(input: string): string {
  if (typeof input !== "string") {
    throw new Error("Input must be a string");
  }

  return input.replace(/[^0-9+\-\s()]/g, "").trim();
}

/**
 * Sanitiza entrada de nome (remove caracteres especiais perigosos)
 */
export function sanitizeName(input: string): string {
  if (typeof input !== "string") {
    throw new Error("Input must be a string");
  }

  return (
    normalizeText(input)
      // Remove caracteres que não são letras, espaços, hífens ou apostrofes
      .replace(/[^a-zA-ZÀ-ÿ\s\-']/g, "")
      // Limita espaços consecutivos
      .replace(/\s+/g, " ")
      .trim()
  );
}

/**
 * Sanitiza entrada de ID (alfanumérico apenas)
 */
export function sanitizeId(input: string): string {
  if (typeof input !== "string") {
    throw new Error("Input must be a string");
  }

  return input.replace(/[^a-zA-Z0-9\-_]/g, "").trim();
}

/**
 * Sanitiza entrada de número
 */
export function sanitizeNumber(input: string | number): number {
  if (typeof input === "number") {
    if (!isFinite(input)) {
      throw new Error("Number must be finite");
    }
    return input;
  }

  if (typeof input !== "string") {
    throw new Error("Input must be a string or number");
  }

  const cleaned = input.replace(/[^0-9.\-]/g, "");
  const parsed = parseFloat(cleaned);

  if (isNaN(parsed) || !isFinite(parsed)) {
    throw new Error("Invalid number format");
  }

  return parsed;
}

/**
 * Detecta tentativas de SQL Injection
 */
export function detectSqlInjection(input: string): boolean {
  if (typeof input !== "string") {
    return false;
  }

  const sqlPatterns = [
    /('|(\-\-)|(;)|(\||\|)|(\*|\*))/i,
    /(union|select|insert|delete|update|drop|create|alter|exec|execute)/i,
    /(script|javascript|vbscript|onload|onerror|onclick)/i,
    /(\<|\>|\&lt;|\&gt;)/i,
  ];

  return sqlPatterns.some((pattern) => pattern.test(input));
}

/**
 * Detecta tentativas de XSS
 */
export function detectXss(input: string): boolean {
  if (typeof input !== "string") {
    return false;
  }

  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<img[^>]+src[\s]*=[\s]*["']?[\s]*javascript:/gi,
    /<[^>]+style[\s]*=[\s]*["'][^"']*expression[\s]*\(/gi,
  ];

  return xssPatterns.some((pattern) => pattern.test(input));
}

/**
 * Valida e sanitiza entrada baseada no tipo
 */
export function validateAndSanitize(
  input: any,
  type: "text" | "html" | "email" | "url" | "phone" | "name" | "id" | "number"
): any {
  if (input === null || input === undefined) {
    throw new Error("Input cannot be null or undefined");
  }

  const inputStr = String(input);

  // Detectar tentativas de ataque
  if (detectSqlInjection(inputStr)) {
    throw new Error("Potential SQL injection detected");
  }

  if (detectXss(inputStr)) {
    throw new Error("Potential XSS attack detected");
  }

  // Sanitizar baseado no tipo
  switch (type) {
    case "text":
      return sanitizeText(inputStr);
    case "html":
      return sanitizeHtml(inputStr);
    case "email":
      return sanitizeEmail(inputStr);
    case "url":
      return sanitizeUrl(inputStr);
    case "phone":
      return sanitizePhone(inputStr);
    case "name":
      return sanitizeName(inputStr);
    case "id":
      return sanitizeId(inputStr);
    case "number":
      return sanitizeNumber(inputStr);
    default:
      throw new Error(`Unknown sanitization type: ${type}`);
  }
}

/**
 * Middleware para sanitização automática de request body
 */
export function createSanitizationMiddleware(
  config: Record<
    string,
    "text" | "html" | "email" | "url" | "phone" | "name" | "id" | "number"
  >
) {
  return function sanitizeRequestBody(body: any): any {
    if (!body || typeof body !== "object") {
      return body;
    }

    const sanitized: any = {};

    for (const [key, value] of Object.entries(body)) {
      const sanitizationType = config[key];

      if (sanitizationType && value !== null && value !== undefined) {
        try {
          sanitized[key] = validateAndSanitize(value, sanitizationType);
        } catch (error) {
          throw new Error(
            `Validation failed for field '${key}': ${error instanceof Error ? error.message : "Unknown error"}`
          );
        }
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  };
}
