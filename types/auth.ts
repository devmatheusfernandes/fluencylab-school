/**
 * Tipos TypeScript para Sistema de Autorização
 *
 * Este arquivo define todos os tipos necessários para o sistema de autorização centralizado,
 * incluindo permissões, contextos, validações e interfaces para middleware.
 */

import { NextRequest, NextResponse } from "next/server";
import { Session } from "next-auth";

// ============================================================================
// TIPOS BÁSICOS DE USUÁRIO E ROLES
// ============================================================================

/**
 * Roles disponíveis no sistema
 */
export type UserRole = "admin" | "manager" | "teacher" | "student";

/**
 * Hierarquia de roles (do maior para o menor privilégio)
 */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 5,
  manager: 4,
  teacher: 3,
  student: 2,
} as const;

/**
 * Permissões específicas do sistema
 */
export type UserPermission =
  // Permissões de aulas
  | "classes.view.own"
  | "classes.view.teaching"
  | "classes.view.all"
  | "classes.cancel.own"
  | "classes.cancel.teaching"
  | "classes.cancel.all"
  | "classes.reschedule.own"
  | "classes.reschedule.teaching"
  | "classes.reschedule.all"
  | "classes.modify.teaching"
  | "classes.modify.all"
  | "classes.create"

  // Permissões de usuários
  | "users.view.own"
  | "users.view.all"
  | "users.create"
  | "users.modify.own"
  | "users.modify.all"
  | "users.delete"

  // Permissões de configurações
  | "settings.modify.own"
  | "settings.modify.all"
  | "settings.view.system"

  // Permissões administrativas
  | "admin.access"
  | "reports.view"
  | "reports.export"
  | "system.configure";

// ============================================================================
// CONTEXTOS DE AUTORIZAÇÃO
// ============================================================================

/**
 * Contexto de autorização para validações específicas
 */
export interface AuthContext {
  /** ID do usuário autenticado */
  userId: string;
  /** Role do usuário */
  userRole: UserRole;
  /** Permissões do usuário */
  permissions: UserPermission[];
  /** ID do recurso sendo acessado (opcional) */
  resourceId?: string;
  /** Tipo do recurso sendo acessado */
  resourceType?: ResourceType;
  /** Dados adicionais do contexto */
  metadata?: Record<string, any>;
}

/**
 * Tipos de recursos que podem ser protegidos
 */
export type ResourceType =
  | "class"
  | "user"
  | "setting"
  | "report"
  | "admin_panel";

/**
 * Resultado de validação de ownership
 */
export interface OwnershipValidationResult {
  /** Se o usuário é dono do recurso */
  isOwner: boolean;
  /** Se o usuário tem contexto (ex: professor da aula) */
  hasContext: boolean;
  /** Motivo da validação (para logs) */
  reason?: string;
  /** Dados adicionais */
  metadata?: Record<string, any>;
}

// ============================================================================
// CONFIGURAÇÕES DE AUTORIZAÇÃO
// ============================================================================

/**
 * Configurações para validação de autorização
 */
export interface AuthorizationConfig {
  /** Roles obrigatórios */
  requiredRoles?: UserRole[];
  /** Permissões obrigatórias */
  requiredPermissions?: UserPermission[];
  /** Se deve validar ownership do recurso */
  requireOwnership?: boolean;
  /** Se deve validar contexto (ex: professor da aula) */
  requireContext?: boolean;
  /** Função customizada de validação */
  customValidator?: (context: AuthContext) => Promise<boolean>;
  /** Configurações de rate limiting */
  rateLimiting?: RateLimitConfig;
  /** Se deve fazer log da operação */
  enableLogging?: boolean;
}

/**
 * Configurações de rate limiting
 */
export interface RateLimitConfig {
  /** Tipo de operação para rate limiting */
  operationType: RateLimitOperationType;
  /** Limite customizado (sobrescreve padrão) */
  customLimit?: {
    requests: number;
    windowMs: number;
  };
  /** Se deve aplicar whitelist para admins */
  adminWhitelist?: boolean;
}

/**
 * Tipos de operação para rate limiting
 */
export type RateLimitOperationType =
  | "cancellation"
  | "reschedule"
  | "login"
  | "general"
  | "admin_operation"
  | "user_creation"
  | "student_cancellation"
  | "teacher_cancellation"
  | "student_reschedule"
  | "teacher_reschedule"
  | "admin_reschedule";

// ============================================================================
// INTERFACES PARA MIDDLEWARE
// ============================================================================

/**
 * Handler de API com tipagem
 */
export type AuthenticatedApiHandler = (
  request: NextRequest,
  context: {
    params?: any;
    authContext: AuthContext;
  }
) => Promise<NextResponse>;

/**
 * Opções para o middleware withAuth
 */
export interface WithAuthOptions {
  /** Configurações de autorização */
  authorization: AuthorizationConfig;
  /** Se deve extrair resourceId dos params */
  extractResourceId?: (params: any) => string;
  /** Tipo do recurso */
  resourceType?: ResourceType;
  /** Headers customizados para resposta */
  customHeaders?: Record<string, string>;
}

/**
 * Resultado do middleware de autorização
 */
export interface AuthMiddlewareResult {
  /** Se a autorização foi bem-sucedida */
  success: boolean;
  /** Contexto de autorização */
  authContext?: AuthContext;
  /** Erro de autorização */
  error?: AuthorizationError;
  /** Response de erro (se aplicável) */
  errorResponse?: NextResponse;
}

// ============================================================================
// ERROS DE AUTORIZAÇÃO
// ============================================================================

/**
 * Tipos de erro de autorização
 */
export type AuthorizationErrorType =
  | "UNAUTHENTICATED"
  | "INSUFFICIENT_ROLE"
  | "MISSING_PERMISSION"
  | "OWNERSHIP_DENIED"
  | "CONTEXT_DENIED"
  | "RATE_LIMITED"
  | "CUSTOM_VALIDATION_FAILED";

/**
 * Erro de autorização
 */
export class AuthorizationError extends Error {
  constructor(
    public type: AuthorizationErrorType,
    public message: string,
    public statusCode: number = 403,
    public metadata?: Record<string, any>
  ) {
    super(message);
    this.name = "AuthorizationError";
  }
}

// ============================================================================
// VALIDADORES DE OWNERSHIP
// ============================================================================

/**
 * Interface para validadores de ownership
 */
export interface OwnershipValidator {
  /** Valida se usuário é dono do recurso */
  validateOwnership(
    userId: string,
    resourceId: string,
    resourceType: ResourceType
  ): Promise<OwnershipValidationResult>;

  /** Valida contexto específico (ex: professor da aula) */
  validateContext(
    userId: string,
    resourceId: string,
    resourceType: ResourceType,
    userRole: UserRole
  ): Promise<OwnershipValidationResult>;
}

// ============================================================================
// MAPEAMENTO DE PERMISSÕES POR ROLE
// ============================================================================

/**
 * Mapeamento de permissões por role
 */
export const ROLE_PERMISSIONS: Record<UserRole, UserPermission[]> = {
  admin: [
    // Todas as permissões
    "classes.view.all",
    "classes.cancel.all",
    "classes.reschedule.all",
    "classes.modify.all",
    "classes.create",
    "users.view.all",
    "users.create",
    "users.modify.all",
    "users.delete",
    "settings.modify.all",
    "settings.view.system",
    "admin.access",
    "reports.view",
    "reports.export",
    "system.configure",
  ],

  manager: [
    "classes.view.all",
    "classes.cancel.all",
    "classes.reschedule.all",
    "classes.modify.all",
    "classes.create",
    "users.view.all",
    "users.create",
    "users.modify.all",
    "settings.modify.all",
    "reports.view",
    "reports.export",
  ],

  teacher: [
    "classes.view.teaching",
    "classes.view.own",
    "classes.cancel.teaching",
    "classes.reschedule.teaching",
    "classes.modify.teaching",
    "users.view.own",
    "users.modify.own",
    "settings.modify.own",
  ],

  student: [
    "classes.view.own",
    "classes.cancel.own",
    "classes.reschedule.own",
    "users.view.own",
    "users.modify.own",
    "settings.modify.own",
  ],
} as const;

// ============================================================================
// UTILITÁRIOS DE TIPO
// ============================================================================

/**
 * Verifica se um role tem uma permissão específica
 */
export function roleHasPermission(
  role: UserRole,
  permission: UserPermission
): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

/**
 * Verifica se um role é superior a outro na hierarquia
 */
export function isRoleHigherThan(role1: UserRole, role2: UserRole): boolean {
  return ROLE_HIERARCHY[role1] > ROLE_HIERARCHY[role2];
}

/**
 * Obtém todas as permissões de um role
 */
export function getPermissionsForRole(role: UserRole): UserPermission[] {
  return [...ROLE_PERMISSIONS[role]];
}

/**
 * Sessão estendida com informações de autorização
 */
export interface ExtendedSession extends Session {
  user: Session["user"] & {
    id: string;
    role: UserRole;
    permissions?: UserPermission[];
  };
}

// ============================================================================
// CONSTANTES DE RATE LIMITING
// ============================================================================

/**
 * Configurações padrão de rate limiting por operação
 */
export const DEFAULT_RATE_LIMITS: Record<
  RateLimitOperationType,
  { requests: number; windowMs: number }
> = {
  cancellation: { requests: 5, windowMs: 60 * 60 * 1000 }, // 5/hora
  reschedule: { requests: 10, windowMs: 60 * 60 * 1000 }, // 10/hora
  login: { requests: 10, windowMs: 15 * 60 * 1000 }, // 10/15min
  general: { requests: 100, windowMs: 60 * 1000 }, // 100/min
  admin_operation: { requests: 50, windowMs: 60 * 60 * 1000 }, // 50/hora
  user_creation: { requests: 20, windowMs: 60 * 60 * 1000 }, // 20/hora
  // Configurações específicas por endpoint
  student_cancellation: { requests: 5, windowMs: 60 * 60 * 1000 }, // 5 cancelamentos por hora
  teacher_cancellation: { requests: 20, windowMs: 60 * 60 * 1000 }, // 20 cancelamentos por hora para professores
  student_reschedule: { requests: 10, windowMs: 60 * 60 * 1000 }, // 10 reagendamentos por hora
  teacher_reschedule: { requests: 30, windowMs: 60 * 60 * 1000 }, // 30 reagendamentos por hora para professores
  admin_reschedule: { requests: 100, windowMs: 60 * 60 * 1000 }, // 100 reagendamentos por hora para admins
} as const;
