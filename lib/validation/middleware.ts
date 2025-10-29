// lib/validation/middleware.ts

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validateApiInput } from "./schemas";
import { detectSqlInjection, detectXss } from "./sanitization";

/**
 * Configurações do middleware de validação
 */
export interface ValidationMiddlewareConfig {
  /** Schema para validação do body */
  bodySchema?: z.ZodSchema<any>;
  /** Schema para validação dos query parameters */
  querySchema?: z.ZodSchema<any>;
  /** Schema para validação dos path parameters */
  paramsSchema?: z.ZodSchema<any>;
  /** Se deve fazer log de tentativas de ataque */
  logAttacks?: boolean;
  /** Se deve bloquear requests com tentativas de ataque */
  blockAttacks?: boolean;
}

/**
 * Resultado da validação
 */
export interface ValidationResult {
  body?: any;
  query?: any;
  params?: any;
  isValid: boolean;
  errors: string[];
  securityIssues: string[];
}

/**
 * Detecta tentativas de ataque em todos os campos de um objeto
 */
function detectAttacksInObject(obj: any, path = ""): string[] {
  const issues: string[] = [];

  if (obj === null || obj === undefined) {
    return issues;
  }

  if (typeof obj === "string") {
    if (detectSqlInjection(obj)) {
      issues.push(`SQL injection attempt detected in ${path || "input"}`);
    }
    if (detectXss(obj)) {
      issues.push(`XSS attempt detected in ${path || "input"}`);
    }
  } else if (typeof obj === "object" && !Array.isArray(obj)) {
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;
      issues.push(...detectAttacksInObject(value, currentPath));
    }
  } else if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      const currentPath = path ? `${path}[${index}]` : `[${index}]`;
      issues.push(...detectAttacksInObject(item, currentPath));
    });
  }

  return issues;
}

/**
 * Extrai parâmetros da URL
 */
function extractParams(
  request: NextRequest,
  pathname: string
): Record<string, string> {
  const params: Record<string, string> = {};

  // Extrair parâmetros dinâmicos da rota (ex: /api/users/[id])
  const pathSegments = pathname.split("/").filter(Boolean);
  const urlSegments = new URL(request.url).pathname.split("/").filter(Boolean);

  pathSegments.forEach((segment, index) => {
    if (segment.startsWith("[") && segment.endsWith("]")) {
      const paramName = segment.slice(1, -1);
      if (urlSegments[index]) {
        params[paramName] = decodeURIComponent(urlSegments[index]);
      }
    }
  });

  return params;
}

/**
 * Valida request usando schemas fornecidos
 */
export async function validateRequest(
  request: NextRequest,
  config: ValidationMiddlewareConfig,
  pathname?: string
): Promise<ValidationResult> {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    securityIssues: [],
  };

  try {
    // Validar body se fornecido
    if (
      config.bodySchema &&
      ["POST", "PUT", "PATCH"].includes(request.method)
    ) {
      try {
        const body = await request.json();

        // Detectar ataques no body
        const bodySecurityIssues = detectAttacksInObject(body, "body");
        result.securityIssues.push(...bodySecurityIssues);

        if (config.blockAttacks && bodySecurityIssues.length > 0) {
          result.isValid = false;
          result.errors.push("Security violation detected in request body");
        } else {
          result.body = validateApiInput(config.bodySchema, body);
        }
      } catch (error) {
        result.isValid = false;
        result.errors.push(
          `Body validation failed: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }

    // Validar query parameters se fornecido
    if (config.querySchema) {
      try {
        const searchParams = new URL(request.url).searchParams;
        const query: Record<string, any> = {};

        searchParams.forEach((value, key) => {
          // Converter arrays (ex: ?tags=a&tags=b)
          if (query[key]) {
            if (Array.isArray(query[key])) {
              query[key].push(value);
            } else {
              query[key] = [query[key], value];
            }
          } else {
            query[key] = value;
          }
        });

        // Detectar ataques nos query params
        const querySecurityIssues = detectAttacksInObject(query, "query");
        result.securityIssues.push(...querySecurityIssues);

        if (config.blockAttacks && querySecurityIssues.length > 0) {
          result.isValid = false;
          result.errors.push("Security violation detected in query parameters");
        } else {
          result.query = validateApiInput(config.querySchema, query);
        }
      } catch (error) {
        result.isValid = false;
        result.errors.push(
          `Query validation failed: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }

    // Validar path parameters se fornecido
    if (config.paramsSchema && pathname) {
      try {
        const params = extractParams(request, pathname);

        // Detectar ataques nos path params
        const paramsSecurityIssues = detectAttacksInObject(params, "params");
        result.securityIssues.push(...paramsSecurityIssues);

        if (config.blockAttacks && paramsSecurityIssues.length > 0) {
          result.isValid = false;
          result.errors.push("Security violation detected in path parameters");
        } else {
          result.params = validateApiInput(config.paramsSchema, params);
        }
      } catch (error) {
        result.isValid = false;
        result.errors.push(
          `Params validation failed: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }

    // Log de tentativas de ataque
    if (config.logAttacks && result.securityIssues.length > 0) {
      console.warn("🚨 Security issues detected:", {
        url: request.url,
        method: request.method,
        userAgent: request.headers.get("user-agent"),
        ip:
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip"),
        issues: result.securityIssues,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    result.isValid = false;
    result.errors.push(
      `Validation middleware error: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }

  return result;
}

/**
 * Cria um middleware de validação para rotas de API
 */
export function createApiValidationMiddleware(
  config: ValidationMiddlewareConfig
) {
  return async function validationMiddleware(
    request: NextRequest,
    pathname?: string
  ): Promise<{ data?: any; response?: NextResponse }> {
    const validation = await validateRequest(
      request,
      pathname ? { ...config } : config,
      pathname
    );

    if (!validation.isValid) {
      return {
        response: NextResponse.json(
          {
            error: "Validation failed",
            details: validation.errors,
            ...(process.env.NODE_ENV === "development" && {
              securityIssues: validation.securityIssues,
            }),
          },
          { status: 400 }
        ),
      };
    }

    if (config.blockAttacks && validation.securityIssues.length > 0) {
      return {
        response: NextResponse.json(
          {
            error: "Security violation detected",
            message: "Request blocked due to potential security threat",
          },
          { status: 403 }
        ),
      };
    }

    return {
      data: {
        body: validation.body,
        query: validation.query,
        params: validation.params,
      },
    };
  };
}

/**
 * Middleware padrão com configurações de segurança
 */
export const secureValidationMiddleware = createApiValidationMiddleware({
  logAttacks: true,
  blockAttacks: process.env.NODE_ENV === "production",
});

/**
 * Utilitário para aplicar validação em handler de API
 */
export function withValidation<T = any>(
  handler: (request: NextRequest, validatedData: T) => Promise<NextResponse>,
  config: ValidationMiddlewareConfig
) {
  return async function validatedHandler(
    request: NextRequest
  ): Promise<NextResponse> {
    const middleware = createApiValidationMiddleware(config);
    const result = await middleware(request);

    if (result.response) {
      return result.response;
    }

    return handler(request, result.data as T);
  };
}
