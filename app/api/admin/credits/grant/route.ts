// app/api/admin/credits/grant/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { CreditService } from "@/services/financial/creditService";
import {
  GrantCreditRequest,
  RegularCreditType,
} from "@/types/credits/regularClassCredits";
import { withValidation } from "@/lib/validation";
import { z } from "zod";

const creditService = new CreditService();

// Schema de validação para concessão de créditos
const grantCreditSchema = z.object({
  studentId: z.string().min(1, "ID do estudante é obrigatório"),
  type: z.enum(
    RegularCreditType,
    "Tipo deve ser: bonus, late-students ou teacher-cancellation"
  ),
  amount: z.number().int().min(1, "Quantidade deve ser maior que zero"),
  expiresAt: z
    .string()
    .refine(
      (date) => new Date(date) > new Date(),
      "Data de expiração deve ser no futuro"
    )
    .transform((date) => new Date(date)),
  reason: z.string().min(1).max(500).optional(),
});

export const POST = withValidation(
  async (
    request: NextRequest,
    validatedData: { body: z.infer<typeof grantCreditSchema> }
  ) => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Check permissions
    const userPermissions = session.user.permissions || [];
    if (!userPermissions.includes("credits.grant")) {
      return NextResponse.json(
        { error: "Permissão insuficiente para conceder créditos" },
        { status: 403 }
      );
    }

    try {
      const { studentId, type, amount, expiresAt, reason } = validatedData.body;

      const credit = await creditService.grantCredits(
        { studentId, type, amount, expiresAt, reason },
        session.user.id
      );

      return NextResponse.json({
        success: true,
        message: "Créditos concedidos com sucesso",
        credit,
      });
    } catch (error: any) {
      console.error("Erro ao conceder créditos:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  },
  {
    bodySchema: grantCreditSchema,
    logAttacks: true,
    blockAttacks: true,
  }
);
