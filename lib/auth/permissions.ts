/**
 * Sistema de Verificação de Permissões
 *
 * Este arquivo implementa as funções base para verificação de permissões,
 * ownership e contexto de autorização.
 */

import {
  AuthContext,
  AuthorizationConfig,
  AuthorizationError,
  AuthorizationErrorType,
  ExtendedSession,
  OwnershipValidationResult,
  OwnershipValidator,
  ResourceType,
  UserPermission,
  UserRole,
  ROLE_PERMISSIONS,
  roleHasPermission,
  isRoleHigherThan,
} from "../../types/auth";

// ============================================================================
// CLASSE PRINCIPAL DE VERIFICAÇÃO DE PERMISSÕES
// ============================================================================

/**
 * Classe principal para verificação de permissões e autorização
 */
export class PermissionChecker {
  private ownershipValidator: OwnershipValidator;

  constructor(ownershipValidator: OwnershipValidator) {
    this.ownershipValidator = ownershipValidator;
  }

  /**
   * Verifica se o usuário tem autorização para realizar uma operação
   */
  async checkAuthorization(
    session: ExtendedSession,
    config: AuthorizationConfig,
    resourceId?: string,
    resourceType?: ResourceType
  ): Promise<AuthContext> {
    // Criar contexto de autorização
    const authContext: AuthContext = {
      userId: session.user.id,
      userRole: session.user.role,
      permissions:
        session.user.permissions || ROLE_PERMISSIONS[session.user.role],
      resourceId,
      resourceType,
    };

    // 1. Verificar roles obrigatórios
    if (config.requiredRoles && config.requiredRoles.length > 0) {
      await this.checkRequiredRoles(authContext, config.requiredRoles);
    }

    // 2. Verificar permissões obrigatórias
    if (config.requiredPermissions && config.requiredPermissions.length > 0) {
      await this.checkRequiredPermissions(
        authContext,
        config.requiredPermissions
      );
    }

    // 3. Verificar ownership se necessário
    if (config.requireOwnership && resourceId && resourceType) {
      await this.checkOwnership(authContext, resourceId, resourceType);
    }

    // 4. Verificar contexto se necessário
    if (config.requireContext && resourceId && resourceType) {
      await this.checkContext(authContext, resourceId, resourceType);
    }

    // 5. Executar validação customizada se fornecida
    if (config.customValidator) {
      const isValid = await config.customValidator(authContext);
      if (!isValid) {
        throw new AuthorizationError(
          "CUSTOM_VALIDATION_FAILED",
          "Validação customizada falhou",
          403,
          { userId: authContext.userId, resourceId }
        );
      }
    }

    return authContext;
  }

  /**
   * Verifica se o usuário tem um dos roles obrigatórios
   */
  private async checkRequiredRoles(
    context: AuthContext,
    requiredRoles: UserRole[]
  ): Promise<void> {
    const hasRequiredRole = requiredRoles.includes(context.userRole);

    if (!hasRequiredRole) {
      // Verificar se tem role superior na hierarquia
      const hasHigherRole = requiredRoles.some((requiredRole) =>
        isRoleHigherThan(context.userRole, requiredRole)
      );

      if (!hasHigherRole) {
        throw new AuthorizationError(
          "INSUFFICIENT_ROLE",
          `Role insuficiente. Requerido: ${requiredRoles.join(", ")}, Atual: ${context.userRole}`,
          403,
          {
            userId: context.userId,
            userRole: context.userRole,
            requiredRoles,
          }
        );
      }
    }
  }

  /**
   * Verifica se o usuário tem todas as permissões obrigatórias
   */
  private async checkRequiredPermissions(
    context: AuthContext,
    requiredPermissions: UserPermission[]
  ): Promise<void> {
    const missingPermissions = requiredPermissions.filter(
      (permission) => !context.permissions.includes(permission)
    );

    if (missingPermissions.length > 0) {
      throw new AuthorizationError(
        "MISSING_PERMISSION",
        `Permissões insuficientes. Faltando: ${missingPermissions.join(", ")}`,
        403,
        {
          userId: context.userId,
          missingPermissions,
          userPermissions: context.permissions,
        }
      );
    }
  }

  /**
   * Verifica ownership do recurso
   */
  private async checkOwnership(
    context: AuthContext,
    resourceId: string,
    resourceType: ResourceType
  ): Promise<void> {
    // Admins e managers têm acesso total
    if (["admin", "manager"].includes(context.userRole)) {
      return;
    }

    const ownershipResult = await this.ownershipValidator.validateOwnership(
      context.userId,
      resourceId,
      resourceType
    );

    if (!ownershipResult.isOwner) {
      throw new AuthorizationError(
        "OWNERSHIP_DENIED",
        `Usuário não é proprietário do recurso ${resourceType}:${resourceId}`,
        403,
        {
          userId: context.userId,
          resourceId,
          resourceType,
          reason: ownershipResult.reason,
        }
      );
    }
  }

  /**
   * Verifica contexto específico (ex: professor da aula)
   */
  private async checkContext(
    context: AuthContext,
    resourceId: string,
    resourceType: ResourceType
  ): Promise<void> {
    // Admins e managers têm acesso total
    if (["admin", "manager"].includes(context.userRole)) {
      return;
    }

    const contextResult = await this.ownershipValidator.validateContext(
      context.userId,
      resourceId,
      resourceType,
      context.userRole
    );

    if (!contextResult.hasContext) {
      throw new AuthorizationError(
        "CONTEXT_DENIED",
        `Usuário não tem contexto para acessar ${resourceType}:${resourceId}`,
        403,
        {
          userId: context.userId,
          resourceId,
          resourceType,
          userRole: context.userRole,
          reason: contextResult.reason,
        }
      );
    }
  }

  /**
   * Verifica se usuário tem permissão específica
   */
  hasPermission(userRole: UserRole, permission: UserPermission): boolean {
    return roleHasPermission(userRole, permission);
  }

  /**
   * Verifica se usuário tem pelo menos uma das permissões
   */
  hasAnyPermission(userRole: UserRole, permissions: UserPermission[]): boolean {
    return permissions.some((permission) =>
      this.hasPermission(userRole, permission)
    );
  }

  /**
   * Verifica se usuário tem todas as permissões
   */
  hasAllPermissions(
    userRole: UserRole,
    permissions: UserPermission[]
  ): boolean {
    return permissions.every((permission) =>
      this.hasPermission(userRole, permission)
    );
  }
}

// ============================================================================
// IMPLEMENTAÇÃO DO VALIDADOR DE OWNERSHIP
// ============================================================================

/**
 * Implementação concreta do validador de ownership
 */
export class DefaultOwnershipValidator implements OwnershipValidator {
  /**
   * Valida ownership de recursos
   */
  async validateOwnership(
    userId: string,
    resourceId: string,
    resourceType: ResourceType
  ): Promise<OwnershipValidationResult> {
    try {
      switch (resourceType) {
        case "class":
          return await this.validateClassOwnership(userId, resourceId);
        case "user":
          return await this.validateUserOwnership(userId, resourceId);
        case "setting":
          return await this.validateSettingOwnership(userId, resourceId);
        default:
          return {
            isOwner: false,
            hasContext: false,
            reason: `Tipo de recurso não suportado: ${resourceType}`,
          };
      }
    } catch (error) {
      console.error(`Erro ao validar ownership: ${error}`);
      return {
        isOwner: false,
        hasContext: false,
        reason: `Erro interno na validação: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      };
    }
  }

  /**
   * Valida contexto específico
   */
  async validateContext(
    userId: string,
    resourceId: string,
    resourceType: ResourceType,
    userRole: UserRole
  ): Promise<OwnershipValidationResult> {
    try {
      switch (resourceType) {
        case "class":
          return await this.validateClassContext(userId, resourceId, userRole);
        default:
          return {
            isOwner: false,
            hasContext: false,
            reason: `Validação de contexto não implementada para ${resourceType}`,
          };
      }
    } catch (error) {
      console.error(`Erro ao validar contexto: ${error}`);
      return {
        isOwner: false,
        hasContext: false,
        reason: `Erro interno na validação de contexto: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      };
    }
  }

  /**
   * Valida ownership de aula
   */
  private async validateClassOwnership(
    userId: string,
    classId: string
  ): Promise<OwnershipValidationResult> {
    // TODO: Implementar consulta ao banco de dados
    // Por enquanto, retorna validação mock

    // Simulação: verificar se userId é o studentId da aula
    // const classData = await schedulingService.getClassById(classId);
    // return {
    //   isOwner: classData.studentId === userId,
    //   hasContext: false,
    //   reason: classData.studentId === userId ? 'Usuário é o estudante da aula' : 'Usuário não é o estudante da aula'
    // };

    console.warn(
      "validateClassOwnership: Implementação mock - substituir por consulta real ao banco"
    );
    return {
      isOwner: true, // Mock: sempre retorna true para desenvolvimento
      hasContext: false,
      reason: "Mock implementation - sempre retorna true",
    };
  }

  /**
   * Valida contexto de aula (professor leciona a aula)
   */
  private async validateClassContext(
    userId: string,
    classId: string,
    userRole: UserRole
  ): Promise<OwnershipValidationResult> {
    if (userRole !== "teacher") {
      return {
        isOwner: false,
        hasContext: false,
        reason: "Validação de contexto de aula apenas para professores",
      };
    }

    // TODO: Implementar consulta ao banco de dados
    // const classData = await schedulingService.getClassById(classId);
    // return {
    //   isOwner: false,
    //   hasContext: classData.teacherId === userId,
    //   reason: classData.teacherId === userId ? 'Professor leciona esta aula' : 'Professor não leciona esta aula'
    // };

    console.warn(
      "validateClassContext: Implementação mock - substituir por consulta real ao banco"
    );
    return {
      isOwner: false,
      hasContext: true, // Mock: sempre retorna true para desenvolvimento
      reason: "Mock implementation - sempre retorna true",
    };
  }

  /**
   * Valida ownership de usuário
   */
  private async validateUserOwnership(
    userId: string,
    targetUserId: string
  ): Promise<OwnershipValidationResult> {
    return {
      isOwner: userId === targetUserId,
      hasContext: false,
      reason:
        userId === targetUserId
          ? "Usuário é o próprio"
          : "Usuário não é o próprio",
    };
  }

  /**
   * Valida ownership de configuração
   */
  private async validateSettingOwnership(
    userId: string,
    settingId: string
  ): Promise<OwnershipValidationResult> {
    // TODO: Implementar lógica específica para configurações
    // Por enquanto, assume que configurações são sempre do próprio usuário
    return {
      isOwner: true,
      hasContext: false,
      reason: "Configurações são sempre do próprio usuário",
    };
  }
}

// ============================================================================
// INSTÂNCIA SINGLETON
// ============================================================================

/**
 * Instância singleton do verificador de permissões
 */
let permissionCheckerInstance: PermissionChecker | null = null;

/**
 * Obtém a instância singleton do verificador de permissões
 */
export function getPermissionChecker(): PermissionChecker {
  if (!permissionCheckerInstance) {
    const ownershipValidator = new DefaultOwnershipValidator();
    permissionCheckerInstance = new PermissionChecker(ownershipValidator);
  }
  return permissionCheckerInstance;
}

// ============================================================================
// FUNÇÕES UTILITÁRIAS
// ============================================================================

/**
 * Cria um erro de autorização padronizado
 */
export function createAuthError(
  type: AuthorizationErrorType,
  message: string,
  statusCode: number = 403,
  metadata?: Record<string, any>
): AuthorizationError {
  return new AuthorizationError(type, message, statusCode, metadata);
}

/**
 * Verifica se um erro é do tipo AuthorizationError
 */
export function isAuthorizationError(error: any): error is AuthorizationError {
  return error instanceof AuthorizationError;
}

/**
 * Converte AuthorizationError em Response JSON
 */
export function authErrorToResponse(error: AuthorizationError) {
  return {
    error: error.message,
    type: error.type,
    statusCode: error.statusCode,
    ...(process.env.NODE_ENV === "development" && { metadata: error.metadata }),
  };
}
