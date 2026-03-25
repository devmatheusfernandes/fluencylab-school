import { NextRequest, NextResponse } from "next/server";
import {
  withAuth,
  createUniversalConfig,
} from "../../../../lib/auth/middleware";
import { UserService } from "@/services/core/userService";

const userService = new UserService();

function getAllowedProfileFieldsForRole(role: string): string[] {
  const baseFields = ["name", "phone", "avatar", "bio", "preferences"];

  switch (role) {
    case "admin":
      return ["*"];
    case "manager":
      return [...baseFields, "permissions"];
    case "teacher":
      return [...baseFields];
    case "student":
      return baseFields;
    default:
      return baseFields;
  }
}

async function getMeHandler(
  request: NextRequest,
  { authContext }: { authContext: any },
) {
  try {
    const user = await userService.getFullUserDetails(authContext.userId);

    if (!user) {
      return NextResponse.json(
        { error: "Utilizador não encontrado." },
        { status: 404 },
      );
    }

    const { password, ...safeUser } = user as any;
    return NextResponse.json(safeUser);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 },
    );
  }
}

export const GET = withAuth(
  getMeHandler,
  createUniversalConfig("user", "general"),
);

async function updateMeHandler(
  request: NextRequest,
  { authContext }: { authContext: any },
) {
  try {
    const updateData = await request.json();

    const allowedFieldsByRole = getAllowedProfileFieldsForRole(
      authContext.userRole,
    );
    const requestedFields = Object.keys(updateData);

    if (!allowedFieldsByRole.includes("*")) {
      const unauthorizedFields = requestedFields.filter(
        (field) => !allowedFieldsByRole.includes(field),
      );

      if (unauthorizedFields.length > 0) {
        return NextResponse.json(
          {
            error: `Campos não permitidos para seu perfil: ${unauthorizedFields.join(", ")}`,
          },
          { status: 403 },
        );
      }
    }

    const restrictedFields = ["id", "email", "createdAt", "updatedAt"];
    const hasRestrictedFields = restrictedFields.some(
      (field) => field in updateData,
    );

    if (hasRestrictedFields) {
      return NextResponse.json(
        { error: "Não é possível atualizar campos restritos." },
        { status: 400 },
      );
    }

    if ("role" in updateData && authContext.userRole !== "admin") {
      return NextResponse.json(
        { error: "Você não pode alterar seu próprio perfil de acesso." },
        { status: 403 },
      );
    }

    if (updateData.name && typeof updateData.name !== "string") {
      return NextResponse.json(
        { error: "Nome deve ser uma string." },
        { status: 400 },
      );
    }

    if (updateData.phone && typeof updateData.phone !== "string") {
      return NextResponse.json(
        { error: "Telefone deve ser uma string." },
        { status: 400 },
      );
    }

    const updatedUser = await userService.updateUser(
      authContext.userId,
      updateData,
    );

    return NextResponse.json({
      success: true,
      message: "Perfil atualizado com sucesso.",
      data: updatedUser,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 },
    );
  }
}

export const PUT = withAuth(
  updateMeHandler,
  createUniversalConfig("user", "general"),
);
