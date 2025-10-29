// app/api/settings/route.ts

import { NextRequest, NextResponse } from "next/server";
import { withAuth, createUniversalConfig } from "../../../lib/auth/middleware";
import { UserService } from "../../../services/userService";
import { withValidation } from "@/lib/validation";
import { z } from "zod";

const userService = new UserService();

/**
 * Função para validar quais configurações cada role pode modificar
 */
function getAllowedSettingsForRole(role: string): string[] {
  const baseSettings = ["language", "timezone", "notifications", "theme"];

  switch (role) {
    case "admin":
      return ["*"]; // Admin pode modificar todas as configurações
    case "manager":
      return [...baseSettings, "schedulingSettings", "paymentSettings"];
    case "teacher":
      return [...baseSettings, "schedulingSettings", "availabilitySettings"];
    case "student":
      return baseSettings;
    default:
      return baseSettings;
  }
}

/**
 * Endpoint para atualização de configurações do usuário
 *
 * Aplicação do novo sistema de autorização:
 * - Validação automática de autenticação
 * - Acesso universal (todos os roles podem atualizar configurações)
 * - Validação de configurações permitidas por role
 * - Rate limiting (100 requests/min)
 * - Logging automático de operações
 */
async function updateSettingsHandler(
  request: NextRequest,
  { params, authContext }: { params?: any; authContext: any }
) {
  try {
    const settingsData = await request.json();

    // Validar quais configurações o role pode modificar
    const allowedSettings = getAllowedSettingsForRole(authContext.userRole);
    const requestedSettings = Object.keys(settingsData);

    // Se não é admin, verificar configurações não permitidas
    if (!allowedSettings.includes("*")) {
      const unauthorizedSettings = requestedSettings.filter(
        (s) => !allowedSettings.includes(s)
      );

      if (unauthorizedSettings.length > 0) {
        return NextResponse.json(
          {
            error: `Configurações não permitidas para seu perfil: ${unauthorizedSettings.join(", ")}`,
          },
          { status: 403 }
        );
      }
    }

    // Validação já foi feita pelo middleware de validação

    // O middleware já validou:
    // 1. Autenticação do usuário
    // 2. Rate limiting

    await userService.updateUserSettings(authContext.userId, settingsData);

    return NextResponse.json({
      success: true,
      message: "Configurações atualizadas com sucesso.",
    });
  } catch (error: any) {
    console.error("Erro ao atualizar configurações:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno do servidor." },
      { status: 500 }
    );
  }
}

// Schema de validação para configurações
const settingsSchema = z.object({
  language: z.enum(["pt", "en", "es"]).optional(),
  timezone: z.string().max(50).optional(),
  theme: z.enum(["light", "dark", "system"]).optional(),
  notifications: z
    .object({
      email: z.boolean().optional(),
      push: z.boolean().optional(),
      sms: z.boolean().optional(),
      classReminders: z.boolean().optional(),
      paymentReminders: z.boolean().optional(),
      announcements: z.boolean().optional(),
    })
    .optional(),
  privacy: z
    .object({
      profileVisibility: z.enum(["public", "private", "contacts"]).optional(),
      showOnlineStatus: z.boolean().optional(),
      allowDirectMessages: z.boolean().optional(),
    })
    .optional(),
  preferences: z
    .object({
      autoJoinClasses: z.boolean().optional(),
      defaultClassDuration: z.number().int().min(15).max(180).optional(),
      preferredTeachers: z.array(z.string()).optional(),
    })
    .optional(),
});

// Aplicar middleware de validação e autorização
const validatedUpdateHandler = withValidation(updateSettingsHandler, {
  bodySchema: settingsSchema,
  logAttacks: true,
  blockAttacks: true,
});

export const PUT = withAuth(
  validatedUpdateHandler,
  createUniversalConfig("settings", "general")
);
