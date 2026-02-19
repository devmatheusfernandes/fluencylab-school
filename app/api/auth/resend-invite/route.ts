import { NextRequest, NextResponse } from "next/server";
import { userService } from "@/services/core/userService";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "O e-mail é obrigatório." },
        { status: 400 },
      );
    }

    await userService.resendWelcomeLink(email);

    return NextResponse.json({
      success: true,
      message: "Link de acesso enviado com sucesso.",
    });
  } catch (error) {
    console.error("Erro ao reenviar convite:", error);
    return NextResponse.json(
      { error: "Erro interno ao enviar o link." },
      { status: 500 },
    );
  }
}
