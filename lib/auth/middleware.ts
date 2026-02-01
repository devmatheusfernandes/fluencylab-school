/**
 * Middleware de Autorização Centralizado
 *
 * Este arquivo implementa o middleware withAuth para Next.js que centraliza
 * todas as verificações de autorização, rate limiting e logging.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../app/api/auth/[...nextauth]/route";
import {
  AuthenticatedApiHandler,
  AuthorizationConfig,
  ExtendedSession,
  WithAuthOptions,
  AuthMiddlewareResult,
  RateLimitConfig,
} from "@/types/core/auth";
import {
  getPermissionChecker,
  isAuthorizationError,
  authErrorToResponse,
  createAuthError,
} from "./permissions";
import { RateLimiter } from "@/lib/security/rateLimit";

// ============================================================================
// MIDDLEWARE PRINCIPAL
// ============================================================================

/**
 * Middleware de autorização centralizado para Next.js
 *
 * @param handler - Handler da API que será executado após validação
 * @param options - Configurações de autorização e rate limiting
 * @returns Handler protegido com validações
 */
export function withAuth(
  handler: AuthenticatedApiHandler,
  options: WithAuthOptions,
) {
  return async function protectedHandler(
    request: NextRequest,
    context: { params?: any },
  ): Promise<NextResponse> {
    // console.log("=== DEBUG withAuth INÍCIO ===");
    // console.log("request.method:", request.method);
    // console.log("request.url:", request.url);
    // console.log("context:", context);
    const startTime = Date.now();
    let authResult: AuthMiddlewareResult | null = null;

    try {
      // 1. Executar validações de autorização
      authResult = await executeAuthValidation(request, context, options);

      if (!authResult.success || !authResult.authContext) {
        return (
          authResult.errorResponse ||
          NextResponse.json({ error: "Falha na autorização" }, { status: 403 })
        );
      }

      // 2. Executar rate limiting se configurado
      if (options.authorization.rateLimiting) {
        await executeRateLimiting(
          request,
          authResult.authContext,
          options.authorization.rateLimiting,
        );
      }

      // 3. Executar handler original
      const response = await handler(request, {
        ...context,
        authContext: authResult.authContext,
      });

      // 4. Adicionar headers customizados
      if (options.customHeaders) {
        Object.entries(options.customHeaders).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
      }

      // 5. Log de sucesso
      if (options.authorization.enableLogging) {
        logAuthSuccess(request, authResult.authContext, Date.now() - startTime);
      }

      return response;
    } catch (error) {
      // 6. Tratamento de erros
      return handleAuthError(error, request, authResult, options, startTime);
    }
  };
}

// ============================================================================
// VALIDAÇÃO DE AUTORIZAÇÃO
// ============================================================================

/**
 * Executa todas as validações de autorização
 */
async function executeAuthValidation(
  request: NextRequest,
  context: { params?: any },
  options: WithAuthOptions,
): Promise<AuthMiddlewareResult> {
  try {
    // 1. Verificar autenticação
    const session = (await getServerSession(authOptions)) as ExtendedSession;

    if (!session?.user?.id) {
      return {
        success: false,
        error: createAuthError(
          "UNAUTHENTICATED",
          "Usuário não autenticado",
          401,
        ),
        errorResponse: NextResponse.json(
          { error: "Acesso não autorizado. Faça login para continuar." },
          { status: 401 },
        ),
      };
    }

    // 2. Extrair resourceId se necessário
    let resourceId: string | undefined;
    if (options.extractResourceId && context.params) {
      // console.log("=== DEBUG MIDDLEWARE ===");
      // console.log("context.params:", context.params);
      try {
        resourceId = options.extractResourceId(context.params);
        // console.log("resourceId extraído:", resourceId);
      } catch (error) {
        // console.error("Erro ao extrair resourceId:", error);
        throw error;
      }
    }

    // 3. Executar verificações de autorização
    const permissionChecker = getPermissionChecker();
    const authContext = await permissionChecker.checkAuthorization(
      session,
      options.authorization,
      resourceId,
      options.resourceType,
    );

    return {
      success: true,
      authContext,
    };
  } catch (error) {
    if (isAuthorizationError(error)) {
      return {
        success: false,
        error,
        errorResponse: NextResponse.json(authErrorToResponse(error), {
          status: error.statusCode,
        }),
      };
    }

    // Erro inesperado
    console.error("Erro inesperado na validação de autorização:", error);
    return {
      success: false,
      error: createAuthError(
        "CUSTOM_VALIDATION_FAILED",
        "Erro interno na validação de autorização",
        500,
      ),
      errorResponse: NextResponse.json(
        { error: "Erro interno do servidor" },
        { status: 500 },
      ),
    };
  }
}

// ============================================================================
// RATE LIMITING
// ============================================================================

/**
 * Executa rate limiting baseado na configuração
 */
async function executeRateLimiting(
  request: NextRequest,
  authContext: any,
  rateLimitConfig: RateLimitConfig,
): Promise<void> {
  const rateLimiter = RateLimiter.getInstance();

  // Verificar whitelist para admins
  if (
    rateLimitConfig.adminWhitelist &&
    ["admin", "manager"].includes(authContext.userRole)
  ) {
    return; // Admins não têm rate limiting
  }

  // Obter IP do cliente
  const clientIp = getClientIp(request);

  // Criar chave única para rate limiting
  const rateLimitKey = `${rateLimitConfig.operationType}:${authContext.userId}:${clientIp}`;

  // Verificar rate limit
  const isAllowed = await rateLimiter.checkRateLimit(
    rateLimitKey,
    rateLimitConfig.operationType,
    rateLimitConfig.customLimit,
  );

  if (!isAllowed) {
    // Log da tentativa bloqueada
    logRateLimitBlocked(request, authContext, rateLimitConfig.operationType);

    throw createAuthError(
      "RATE_LIMITED",
      `Muitas tentativas. Tente novamente mais tarde.`,
      429,
      {
        operationType: rateLimitConfig.operationType,
        userId: authContext.userId,
        clientIp,
      },
    );
  }
}

/**
 * Extrai IP do cliente da requisição
 */
function getClientIp(request: NextRequest): string {
  // Verificar headers de proxy
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  // NextRequest não tem propriedade ip, usar headers alternativos
  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  return "unknown";
}

// ============================================================================
// TRATAMENTO DE ERROS
// ============================================================================

/**
 * Trata erros de autorização e retorna resposta apropriada
 */
function handleAuthError(
  error: any,
  request: NextRequest,
  authResult: AuthMiddlewareResult | null,
  options: WithAuthOptions,
  startTime: number,
): NextResponse {
  // Log do erro
  if (options.authorization.enableLogging) {
    logAuthError(error, request, authResult, Date.now() - startTime);
  }

  // Tratar erro de autorização
  if (isAuthorizationError(error)) {
    return NextResponse.json(authErrorToResponse(error), {
      status: error.statusCode,
      headers: {
        "X-RateLimit-Error": error.type === "RATE_LIMITED" ? "true" : "false",
      },
    });
  }

  // Erro inesperado
  console.error("Erro inesperado no middleware de autorização:", error);
  return NextResponse.json(
    { error: "Erro interno do servidor" },
    { status: 500 },
  );
}

// ============================================================================
// LOGGING
// ============================================================================

/**
 * Log de autorização bem-sucedida
 */
function logAuthSuccess(
  request: NextRequest,
  authContext: any,
  duration: number,
): void {
  const logData = {
    timestamp: new Date().toISOString(),
    type: "AUTH_SUCCESS",
    method: request.method,
    url: request.url,
    userId: authContext.userId,
    userRole: authContext.userRole,
    resourceId: authContext.resourceId,
    resourceType: authContext.resourceType,
    duration,
    clientIp: getClientIp(request),
  };

  //  console.log("Auth Success:", JSON.stringify(logData));
}

/**
 * Log de erro de autorização
 */
function logAuthError(
  error: any,
  request: NextRequest,
  authResult: AuthMiddlewareResult | null,
  duration: number,
): void {
  const logData = {
    timestamp: new Date().toISOString(),
    type: "AUTH_ERROR",
    method: request.method,
    url: request.url,
    error: error.message,
    errorType: isAuthorizationError(error) ? error.type : "UNKNOWN",
    userId: authResult?.authContext?.userId || "unknown",
    duration,
    clientIp: getClientIp(request),
  };

  console.error("Auth Error:", JSON.stringify(logData));
}

/**
 * Log de rate limit bloqueado
 */
function logRateLimitBlocked(
  request: NextRequest,
  authContext: any,
  operationType: string,
): void {
  const logData = {
    timestamp: new Date().toISOString(),
    type: "RATE_LIMIT_BLOCKED",
    method: request.method,
    url: request.url,
    userId: authContext.userId,
    userRole: authContext.userRole,
    operationType,
    clientIp: getClientIp(request),
  };

  console.warn("Rate Limit Blocked:", JSON.stringify(logData));
}

// ============================================================================
// HELPERS PARA CONFIGURAÇÃO
// ============================================================================

/**
 * Cria configuração básica de autorização
 */
export function createAuthConfig(
  config: Partial<AuthorizationConfig>,
): AuthorizationConfig {
  return {
    enableLogging: true,
    ...config,
  };
}

/**
 * Cria configuração para endpoints que requerem ownership
 */
export function createOwnershipConfig(
  requiredRoles: string[],
  resourceType: string,
  rateLimitType?: string,
): WithAuthOptions {
  return {
    authorization: {
      requiredRoles: requiredRoles as any[],
      requireOwnership: true,
      enableLogging: true,
      ...(rateLimitType && {
        rateLimiting: {
          operationType: rateLimitType as any,
          adminWhitelist: true,
        },
      }),
    },
    resourceType: resourceType as any,
    extractResourceId: (params) => {
      return params?.classId || params?.id || params?.userId;
    },
  };
}

// Funções de configuração removidas - usando as versões mais recentes abaixo

// ============================================================================
// CONFIGURAÇÕES ESPECÍFICAS POR TIPO DE USUÁRIO
// ============================================================================

/**
 * Configuração básica para estudantes
 */
export function createStudentAuthConfig(): WithAuthOptions {
  return {
    authorization: {
      requiredRoles: ["student"] as any[],
      requireOwnership: true,
      enableLogging: true,
      rateLimiting: {
        operationType: "general" as any,
        adminWhitelist: true,
      },
    },
  };
}

/**
 * Configuração básica para professores
 */
export function createTeacherAuthConfig(): WithAuthOptions {
  return {
    authorization: {
      requiredRoles: ["teacher", "admin", "manager"] as any[],
      requireOwnership: false,
      requireContext: true,
      enableLogging: true,
      rateLimiting: {
        operationType: "general" as any,
        adminWhitelist: true,
      },
    },
  };
}

/**
 * Configuração básica para administradores
 */
export function createAdminAuthConfig(): WithAuthOptions {
  return {
    authorization: {
      requiredRoles: ["admin", "manager"] as any[],
      requireOwnership: false,
      requireContext: false,
      enableLogging: true,
      rateLimiting: {
        operationType: "general" as any,
        adminWhitelist: false,
      },
    },
  };
}

/**
 * Configuração específica para estudantes com tipo de operação
 */
export function createStudentConfig(
  resourceType: string,
  operationType: string,
): WithAuthOptions {
  return {
    authorization: {
      requiredRoles: ["student"] as any[],
      requireOwnership: true,
      enableLogging: true,
      rateLimiting: {
        operationType: operationType as any,
        adminWhitelist: true,
      },
    },
    resourceType: resourceType as any,
    extractResourceId: (params) => {
      // console.log("=== DEBUG extractResourceId ===");
      // console.log("params recebido:", params);
      const resourceId = params?.classId || params?.id;
      // console.log("resourceId final:", resourceId);
      return resourceId;
    },
  };
}

/**
 * Configuração específica para professores com tipo de operação
 */
export function createTeacherConfig(
  resourceType: string,
  operationType: string,
): WithAuthOptions {
  return {
    authorization: {
      requiredRoles: ["teacher", "admin", "manager"] as any[],
      requireOwnership: false,
      requireContext: true,
      enableLogging: true,
      rateLimiting: {
        operationType: operationType as any,
        adminWhitelist: true,
      },
    },
    resourceType: resourceType as any,
    extractResourceId: (params) => {
      return params?.classId || params?.id;
    },
  };
}

/**
 * Configuração universal que se adapta ao tipo de usuário
 */
export function createUniversalConfig(
  resourceType: string,
  rateLimitType: string = "general",
): WithAuthOptions {
  return {
    authorization: {
      requiredRoles: ["student", "teacher", "admin", "manager"] as any[],
      requireOwnership: true, // Será validado baseado no papel do usuário
      requireContext: true, // Será validado baseado no papel do usuário
      enableLogging: true,
      rateLimiting: {
        operationType: rateLimitType as any,
        adminWhitelist: true,
      },
    },
    resourceType: resourceType as any,
    extractResourceId: (params) => {
      return params?.classId || params?.id || params?.userId;
    },
  };
}

/**
 * Configuração específica para administradores com tipo de operação
 */
export function createAdminConfig(
  resourceType: string,
  operationType: string = "general",
): WithAuthOptions {
  return {
    authorization: {
      requiredRoles: ["admin", "manager"] as any[],
      requireOwnership: false,
      requireContext: false,
      enableLogging: true,
      rateLimiting: {
        operationType: operationType as any,
        adminWhitelist: false,
      },
    },
    resourceType: resourceType as any,
    extractResourceId: (params) =>
      params?.classId || params?.id || params?.userId,
  };
}
