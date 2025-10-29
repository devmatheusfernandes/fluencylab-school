// app/api/profile/route.ts

import { NextRequest, NextResponse } from "next/server";
import { withAuth, createUniversalConfig } from "../../../lib/auth/middleware";
import { UserService } from "../../../services/userService";

const userService = new UserService();

/**
 * Função para validar quais campos de perfil cada role pode modificar
 */
function getAllowedProfileFieldsForRole(role: string): string[] {
  const baseFields = ["name", "phone", "avatar", "bio", "preferences"];

  switch (role) {
    case "admin":
      return ["*"]; // Admin pode modificar todos os campos
    case "manager":
      return [...baseFields, "department", "permissions"];
    case "teacher":
      return [...baseFields, "specialties", "experience", "certifications"];
    case "student":
      return baseFields;
    default:
      return baseFields;
  }
}

/**
 * Endpoint para atualização de perfil do usuário
 *
 * Aplicação do novo sistema de autorização:
 * - Validação automática de autenticação
 * - Acesso universal (todos os roles podem atualizar seu próprio perfil)
 * - Validação de ownership (usuário só pode atualizar seu próprio perfil)
 * - Rate limiting (100 requests/min)
 * - Logging automático de operações
 */
async function updateProfileHandler(
  request: NextRequest,
  { params, authContext }: { params?: any; authContext: any }
) {
  try {
    const updateData = await request.json();

    // Validar campos que cada role pode modificar
    const allowedFieldsByRole = getAllowedProfileFieldsForRole(
      authContext.userRole
    );
    const requestedFields = Object.keys(updateData);

    // Se não é admin, verificar campos não permitidos
    if (!allowedFieldsByRole.includes("*")) {
      const unauthorizedFields = requestedFields.filter(
        (field) => !allowedFieldsByRole.includes(field)
      );

      if (unauthorizedFields.length > 0) {
        return NextResponse.json(
          {
            error: `Campos não permitidos para seu perfil: ${unauthorizedFields.join(", ")}`,
          },
          { status: 403 }
        );
      }
    }

    // Impedir modificação de campos sensíveis (exceto para admins)
    const restrictedFields = ["id", "email", "createdAt", "updatedAt"];
    const hasRestrictedFields = restrictedFields.some(
      (field) => field in updateData
    );

    if (hasRestrictedFields) {
      return NextResponse.json(
        { error: "Não é possível atualizar campos restritos." },
        { status: 400 }
      );
    }

    // Impedir modificação de role próprio (exceto para admins)
    if ("role" in updateData && authContext.userRole !== "admin") {
      return NextResponse.json(
        { error: "Você não pode alterar seu próprio perfil de acesso." },
        { status: 403 }
      );
    }

    // Validate data types and formats
    if (updateData.name && typeof updateData.name !== "string") {
      return NextResponse.json(
        { error: "Nome deve ser uma string." },
        { status: 400 }
      );
    }

    if (updateData.phone && typeof updateData.phone !== "string") {
      return NextResponse.json(
        { error: "Telefone deve ser uma string." },
        { status: 400 }
      );
    }

    // O middleware já validou:
    // 1. Autenticação do usuário
    // 2. Rate limiting

    const updatedUser = await userService.updateUser(
      authContext.userId,
      updateData
    );

    return NextResponse.json({
      success: true,
      message: "Perfil atualizado com sucesso.",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}

// GET - Obter dados do perfil
async function getProfileHandler(
  request: NextRequest,
  { params, authContext }: { params?: any; authContext: any }
) {
  try {
    // O middleware já validou:
    // 1. Autenticação do usuário
    // 2. Rate limiting

    const user = await userService.getFullUserDetails(authContext.userId);

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado." },
        { status: 404 }
      );
    }

    // Remove sensitive information if present
    const { password, ...safeUserData } = user as any;

    return NextResponse.json({
      success: true,
      data: safeUserData,
    });
  } catch (error) {
    console.error("Erro ao buscar perfil:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}

// Aplicar middleware de autorização com configuração universal
export const PUT = withAuth(
  updateProfileHandler,
  createUniversalConfig("user", "general")
);

export const GET = withAuth(
  getProfileHandler,
  createUniversalConfig("user", "general")
);
